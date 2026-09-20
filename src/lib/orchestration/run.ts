import { ceoPlanSchema } from "@/lib/agents/schema";
import { nowIso } from "@/lib/clock";
import { AGENT_ROSTER, demoCeoPlan, demoContentItems, demoSpecialistOutput } from "@/lib/demo/fixtures";
import { appendEvent } from "@/lib/events/log";
import { assembleReport, evaluateAgentOutput, rejectIfOverBudget } from "@/lib/evaluation/report";
import { createId } from "@/lib/ids";
import { settleMediaJob } from "@/lib/media/jobs";
import { hasBlockingApproval, requestApproval } from "@/lib/approvals/engine";
import { completeJson, parseAgentOutput, type LLMProvider } from "@/lib/providers/llm";
import type { MediaProvider } from "@/lib/providers/higgsfield";
import type { Store } from "@/lib/store";
import { searchGithubIssues } from "@/lib/tools/github";
import { calculate } from "@/lib/tools/calculator";
import type { ResearchProvider } from "@/lib/tools/search";
import type { AgentOutput, AgentType, Organization, Run, RunStatus, Task } from "@/types";
import { assertTransition, isTerminal } from "./states";
import { completeTask, dependenciesSatisfied, failTask, startTask } from "./task-engine";

export type OrchestratorDeps = {
  store: Store;
  llm: LLMProvider;
  search: ResearchProvider;
  media: MediaProvider;
};

const DEFAULT_CAPS = {
  maxSteps: 24,
  maxCostCents: 20000,
  maxDurationMs: 15 * 60 * 1000,
  maxRetries: 1,
};

export function defaultRunCaps() {
  return { ...DEFAULT_CAPS };
}

async function transition(store: Store, run: Run, to: RunStatus): Promise<Run> {
  assertTransition(run.status, to);
  const next = await store.updateRun(run.id, { status: to, updatedAt: nowIso(), stepCount: run.stepCount + 1 });
  await appendEvent(store, {
    organizationId: run.organizationId,
    runId: run.id,
    type: "run.step",
    summary: `Phase ${run.status} → ${to}`,
    payload: { from: run.status, to },
  });
  return next;
}

async function addCost(store: Store, org: Organization, run: Run, cents: number): Promise<{ org: Organization; run: Run }> {
  const nextOrg = await store.updateOrganization(org.id, {
    budgetUsedCents: org.budgetUsedCents + cents,
  });
  const nextRun = await store.updateRun(run.id, {
    costCents: run.costCents + cents,
    updatedAt: nowIso(),
  });
  return { org: nextOrg, run: nextRun };
}

async function executeAgentTask(
  deps: OrchestratorDeps,
  org: Organization,
  run: Run,
  task: Task,
  agentType: AgentType,
  extraFindings: unknown[] = [],
): Promise<{ org: Organization; run: Run; output: AgentOutput }> {
  const all = await deps.store.listTasksByRun(run.id);
  const started = await startTask(deps.store, task, all);
  if (started.status === "blocked") {
    return {
      org,
      run,
      output: {
        status: "blocked",
        summary: "Waiting on dependencies",
        findings: [],
        evidence: [],
        risks: [],
        confidence: 0,
        artifacts: [],
        estimatedCostCents: 0,
      },
    };
  }

  const agent = await deps.store.getAgent(task.agentId);
  if (agent) {
    await deps.store.updateAgent(agent.id, { status: "working", currentTaskId: task.id });
  }

  const findings: unknown[] = [...extraFindings];
  if (agentType === "finance" || agentType === "engineering") {
    try {
      const mediaCap = calculate("40 + 40");
      findings.push({ tool: "calculator", expression: "40 + 40", result: mediaCap });
      await appendEvent(deps.store, {
        organizationId: org.id,
        runId: run.id,
        type: "tool.called",
        summary: `calculator returned ${mediaCap}`,
        payload: { tool: "calculator", result: mediaCap },
      });
    } catch (error) {
      await appendEvent(deps.store, {
        organizationId: org.id,
        runId: run.id,
        type: "tool.failed",
        summary: `calculator failed: ${error instanceof Error ? error.message : "error"}`,
      });
    }
  }

  const demo = demoSpecialistOutput(agentType, org.goal);
  let output: AgentOutput = { ...demo, taskId: task.id, agentType };
  let costCents = demo.estimatedCostCents;
  let usedDemo = true;

  try {
    const completed = await completeJson(
      deps.llm,
      {
        system: `You are the ${agentType} agent in Rivera, an AI product-launch organization. Return JSON matching the agent output schema.`,
        user: JSON.stringify({
          goal: org.goal,
          targetUser: org.targetUser,
          budgetCents: org.budgetCents,
          deadline: org.deadline,
          task: { title: task.title, description: task.description },
          extraFindings: findings,
        }),
      },
      parseAgentOutput,
    );
    output = { ...completed.value, taskId: task.id, agentType, findings: [...completed.value.findings, ...findings] };
    costCents = completed.costCents;
    usedDemo = completed.demo;
  } catch {
    output = { ...demo, taskId: task.id, agentType, findings: [...demo.findings, ...findings] };
    usedDemo = true;
  }

  const remaining = org.budgetCents - org.budgetUsedCents;
  const budgetCheck = rejectIfOverBudget(output.estimatedCostCents, remaining);
  const evaluation = evaluateAgentOutput(output);
  if (!budgetCheck.accepted) {
    evaluation.retryRecommended = true;
    evaluation.notes = budgetCheck.reason ?? evaluation.notes;
  }

  const charged = await addCost(deps.store, org, run, costCents);
  if (agent) {
    await deps.store.updateAgent(agent.id, {
      status: output.status === "failed" ? "failed" : "idle",
      spentCents: agent.spentCents + costCents,
      lastAction: output.summary,
      confidence: output.confidence,
      currentTaskId: undefined,
    });
  }

  await appendEvent(deps.store, {
    organizationId: org.id,
    runId: run.id,
    type: output.status === "failed" ? "task.failed" : "task.completed",
    summary: `${agentType}: ${output.summary}`,
    payload: { taskId: task.id, demo: usedDemo },
  });

  if (output.status === "failed") {
    await failTask(deps.store, task.id, output);
  } else {
    await completeTask(deps.store, task.id, output, costCents, evaluation);
  }

  return { org: charged.org, run: charged.run, output };
}

async function runCeoPlan(deps: OrchestratorDeps, org: Organization, run: Run) {
  let plan = demoCeoPlan(org.goal);
  let demo = true;
  let costCents = 3;
  try {
    const completed = await completeJson(
      deps.llm,
      {
        system: "You are Rivera CEO. Return JSON for organizationName, domain, summary, recommendation, confidence, agents[], tasks[].",
        user: JSON.stringify({
          goal: org.goal,
          targetUser: org.targetUser,
          budgetUsd: org.budgetCents / 100,
          deadline: org.deadline,
          technology: org.technology,
        }),
      },
      (value) => ceoPlanSchema.parse(value),
    );
    plan = completed.value;
    demo = completed.demo;
    costCents = completed.costCents;
  } catch {
    plan = demoCeoPlan(org.goal);
    demo = true;
  }

  const charged = await addCost(deps.store, org, run, costCents);
  org = charged.org;
  run = await deps.store.updateRun(charged.run.id, { demoMode: run.demoMode || demo });

  const ceo = AGENT_ROSTER.find((agent) => agent.type === "ceo")!;
  await deps.store.createAgent({
    id: createId(),
    organizationId: org.id,
    type: "ceo",
    name: ceo.name,
    objective: plan.summary,
    tools: [],
    permissions: ["plan", "decide", "request_approval"],
    budgetCents: Math.round(org.budgetCents * 0.1),
    spentCents: costCents,
    status: "idle",
    lastAction: plan.recommendation,
    confidence: plan.confidence,
  });

  const agentIds = new Map<AgentType, string>();
  for (const spec of plan.agents) {
    const roster = AGENT_ROSTER.find((item) => item.type === spec.type);
    const agent = await deps.store.createAgent({
      id: createId(),
      organizationId: org.id,
      type: spec.type,
      name: roster?.name ?? spec.type,
      objective: spec.objective,
      tools: spec.tools,
      permissions: ["draft"],
      budgetCents: Math.round(org.budgetCents / Math.max(plan.agents.length, 1)),
      spentCents: 0,
      status: "idle",
    });
    agentIds.set(spec.type, agent.id);
    await appendEvent(deps.store, {
      organizationId: org.id,
      runId: run.id,
      type: "agent.created",
      summary: `Activated ${agent.name}`,
      payload: { agentId: agent.id, type: agent.type },
    });
  }

  const titleToId = new Map<string, string>();
  for (const spec of plan.tasks) {
    const task = await deps.store.createTask({
      id: createId(),
      organizationId: org.id,
      runId: run.id,
      agentId: agentIds.get(spec.agentType) ?? [...agentIds.values()][0],
      title: spec.title,
      description: spec.description,
      dependencies: [],
      status: "todo",
      input: { goal: org.goal },
      estimatedCostCents: spec.estimatedCostCents,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    titleToId.set(spec.title, task.id);
    await appendEvent(deps.store, {
      organizationId: org.id,
      runId: run.id,
      type: "task.assigned",
      summary: `Assigned ${spec.title} to ${spec.agentType}`,
      payload: { taskId: task.id, agentType: spec.agentType },
    });
  }

  const created = await deps.store.listTasksByRun(run.id);
  for (const spec of plan.tasks) {
    const id = titleToId.get(spec.title);
    if (!id) continue;
    const depsIds = (spec.dependsOnTitles ?? [])
      .map((title) => titleToId.get(title))
      .filter((value): value is string => Boolean(value));
    if (depsIds.length) {
      await deps.store.updateTask(id, { dependencies: depsIds });
    }
    const task = created.find((item) => item.id === id);
    if (task && !dependenciesSatisfied({ ...task, dependencies: depsIds }, created)) {
      await deps.store.updateTask(id, { status: "blocked" });
    }
  }

  await deps.store.updateOrganization(org.id, {
    name: plan.organizationName,
    domain: plan.domain,
  });

  return transition(deps.store, run, "research");
}

async function runTypedTasks(
  deps: OrchestratorDeps,
  org: Organization,
  run: Run,
  types: AgentType[],
  extraByType?: Partial<Record<AgentType, unknown[]>>,
) {
  const tasks = await deps.store.listTasksByRun(run.id);
  const agents = await deps.store.listAgents(org.id);
  for (const type of types) {
    const agent = agents.find((item) => item.type === type);
    const task = tasks.find((item) => item.agentId === agent?.id && item.status !== "done");
    if (!task || !agent) continue;
    const result = await executeAgentTask(deps, org, run, task, type, extraByType?.[type] ?? []);
    org = result.org;
    run = result.run;
  }
  return { org, run };
}

async function createDecision(deps: OrchestratorDeps, org: Organization, run: Run) {
  const tasks = await deps.store.listTasksByRun(run.id);
  const outputs = tasks
    .map((task) => task.output as { recommendation?: string; evidence?: unknown[]; risks?: unknown[]; agentType?: AgentType } | undefined)
    .filter(Boolean);

  const question = "Should the MVP be a CLI or a hosted dashboard?";
  const proposals = [
    {
      id: createId(),
      agentType: "engineering" as const,
      recommendation:
        outputs.find((item) => item?.agentType === "engineering")?.recommendation ??
        "CLI is faster to build and stays inside the $500 budget.",
      evidence: outputs.find((item) => item?.agentType === "engineering")?.evidence ?? [],
      risks: ["Less flashy for a demo recording"],
    },
    {
      id: createId(),
      agentType: "finance" as const,
      recommendation:
        outputs.find((item) => item?.agentType === "finance")?.recommendation ??
        "Hosted infrastructure increases cost and should wait.",
      evidence: [],
      risks: ["Hosting can spend the whole media budget"],
    },
    {
      id: createId(),
      agentType: "marketing" as const,
      recommendation:
        outputs.find((item) => item?.agentType === "marketing")?.recommendation ??
        "A hosted dashboard is easier to screenshot, but the CLI demo can still be filmed.",
      evidence: [],
      risks: ["A dashboard-first story overpromises"],
    },
  ];

  const decision = await deps.store.createDecision({
    id: createId(),
    organizationId: org.id,
    runId: run.id,
    question,
    proposals,
    selectedProposalId: proposals[0].id,
    rationale: "Build the CLI first and position the hosted dashboard as a paid upgrade.",
    confidence: 0.8,
    status: "approved",
    createdAt: nowIso(),
  });

  await appendEvent(deps.store, {
    organizationId: org.id,
    runId: run.id,
    type: "decision.made",
    summary: `CEO decision: ${decision.rationale}`,
    payload: { decisionId: decision.id },
  });

  run = await transition(deps.store, run, "decision");
  return transition(deps.store, run, "build_plan");
}

async function createCampaign(deps: OrchestratorDeps, org: Organization, run: Run) {
  const campaign = await deps.store.createCampaign({
    id: createId(),
    organizationId: org.id,
    runId: run.id,
    title: `${org.name} launch`,
    pillars: ["Problem", "Product demo", "Founder note", "Countdown"],
    createdAt: nowIso(),
  });
  const drafts = demoContentItems(org.preferredChannels);
  for (const draft of drafts) {
    await deps.store.createContentItem({
      id: createId(),
      campaignId: campaign.id,
      organizationId: org.id,
      ...draft,
      mediaAssetIds: [],
      status: "draft",
      estimatedCostCents: draft.type === "video" ? 80 : 20,
    });
  }
  await appendEvent(deps.store, {
    organizationId: org.id,
    runId: run.id,
    type: "content.created",
    summary: `Drafted ${drafts.length} launch posts`,
    payload: { campaignId: campaign.id },
  });
  return campaign;
}

async function generateCampaignMedia(deps: OrchestratorDeps, org: Organization, run: Run) {
  const items = await deps.store.listContentItems(org.id);
  for (const item of items) {
    if (item.type === "text") {
      await deps.store.updateContentItem(item.id, { status: "review" });
      continue;
    }
    const ceiling = item.estimatedCostCents ?? 80;
    if (ceiling >= 2500) {
      await requestApproval(deps.store, {
        organizationId: org.id,
        runId: run.id,
        actionType: "spend_budget",
        targetId: item.id,
        summary: `Spend $${(ceiling / 100).toFixed(2)} on ${item.type} generation`,
        payload: { cents: ceiling },
      });
      continue;
    }
    const created =
      item.type === "video"
        ? await deps.media.createVideo({
            prompt: item.hook,
            type: "video",
            costCeilingCents: Math.max(ceiling, 40),
            webhookUrl: process.env.HIGGSFIELD_WEBHOOK_URL,
          })
        : await deps.media.createImage({
            prompt: item.hook,
            type: "image",
            costCeilingCents: Math.max(ceiling, 25),
            webhookUrl: process.env.HIGGSFIELD_WEBHOOK_URL,
          });

    const job = await deps.store.createMediaJob({
      id: createId(),
      organizationId: org.id,
      contentItemId: item.id,
      provider: "higgsfield",
      providerJobId: created.providerJobId,
      type: item.type === "video" ? "video" : "image",
      prompt: item.hook,
      inputAssetIds: [],
      status: created.status,
      outputUrl: created.outputUrl,
      previewUrl: created.previewUrl,
      estimatedCostCents: created.estimatedCostCents,
      actualCostCents: created.status === "completed" ? created.estimatedCostCents : undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    await appendEvent(deps.store, {
      organizationId: org.id,
      runId: run.id,
      type: "media.job.created",
      summary: `Higgsfield ${item.type} job ${created.status}`,
      payload: { jobId: job.id, providerJobId: created.providerJobId },
    });

    const settled = await settleMediaJob(deps.store, deps.media, job);
    if (settled.status === "completed") {
      const latest = await deps.store.getContentItem(item.id);
      if (latest && latest.status === "draft") {
        await deps.store.updateContentItem(item.id, { status: "review" });
      }
      const charged = await addCost(deps.store, org, run, settled.estimatedCostCents ?? created.estimatedCostCents);
      org = charged.org;
      run = charged.run;
    }
  }
  return { org, run };
}

export async function finishEvaluation(deps: OrchestratorDeps, org: Organization, run: Run) {
  const tasks = await deps.store.listTasksByRun(run.id);
  const evaluatorOutput = tasks
    .map((task) => task.output as AgentOutput | undefined)
    .find((output) => output?.agentType === "evaluator");
  const artifacts = tasks.flatMap((task) => {
    const output = task.output as AgentOutput | undefined;
    return output?.artifacts ?? [];
  });
  const risks = tasks.flatMap((task) => {
    const output = task.output as AgentOutput | undefined;
    return (output?.risks ?? []).map((risk) => String(risk));
  });
  const report = assembleReport({
    organization: org,
    run,
    evaluator: evaluatorOutput,
    artifacts,
    risks,
  });
  await deps.store.saveReport(report);
  if (run.status === "published" || run.status === "evaluation") {
    if (run.status === "published") run = await transition(deps.store, run, "evaluation");
    run = await transition(deps.store, run, "complete");
  } else if (run.status === "review" || run.status === "approval") {
    run = await deps.store.updateRun(run.id, { updatedAt: nowIso() });
  }
  await deps.store.updateOrganization(org.id, { status: run.status === "complete" ? "completed" : org.status });
  return run;
}

export async function completeAfterPublish(deps: OrchestratorDeps, org: Organization, run: Run): Promise<Run> {
  let current = run;
  if (current.status === "review") current = await transition(deps.store, current, "approval");
  if (current.status === "approval" || current.status === "scheduled") {
    current = await transition(deps.store, current, "published");
  }
  return finishEvaluation(deps, org, current);
}

export async function runOrganization(runId: string, deps: OrchestratorDeps): Promise<Run> {
  let run = await deps.store.getRun(runId);
  if (!run) throw new Error("Run not found");
  let org = await deps.store.getOrganization(run.organizationId);
  if (!org) throw new Error("Organization not found");

  while (!isTerminal(run.status)) {
    if (run.cancelled) {
      return deps.store.updateRun(run.id, { status: "cancelled", updatedAt: nowIso() });
    }
    if (run.stepCount >= run.caps.maxSteps) {
      return deps.store.updateRun(run.id, { status: "failed", error: "Maximum step count reached", updatedAt: nowIso() });
    }
    if (run.costCents >= run.caps.maxCostCents) {
      return deps.store.updateRun(run.id, { status: "failed", error: "Maximum cost reached", updatedAt: nowIso() });
    }
    if (process.env.DEMO_MODE !== "true" && Date.now() - Date.parse(run.startedAt) >= run.caps.maxDurationMs) {
      return deps.store.updateRun(run.id, { status: "failed", error: "Maximum duration reached", updatedAt: nowIso() });
    }
    if (await hasBlockingApproval(deps.store, org.id)) {
      await appendEvent(deps.store, {
        organizationId: org.id,
        runId: run.id,
        type: "run.paused",
        summary: "Orchestrator paused for human approval",
      });
      return run;
    }

    switch (run.status) {
      case "intake":
        run = await transition(deps.store, run, "planning");
        break;
      case "planning":
        run = await runCeoPlan(deps, org, run);
        org = (await deps.store.getOrganization(org.id))!;
        break;
      case "research": {
        const search = await deps.search.search(`${org.goal} ${org.targetUser}`);
        await appendEvent(deps.store, {
          organizationId: org.id,
          runId: run.id,
          type: "tool.called",
          summary: `webSearch returned ${search.length} sources`,
          payload: { tool: "webSearch", results: search },
        });
        let github: unknown[] = [];
        try {
          github = await searchGithubIssues(`${org.domain || "soroban"} debug`);
          await appendEvent(deps.store, {
            organizationId: org.id,
            runId: run.id,
            type: "tool.called",
            summary: `github search returned ${github.length} issues`,
            payload: { tool: "github", results: github },
          });
        } catch (error) {
          await appendEvent(deps.store, {
            organizationId: org.id,
            runId: run.id,
            type: "tool.failed",
            summary: `github search failed: ${error instanceof Error ? error.message : "error"}`,
          });
        }
        const result = await runTypedTasks(deps, org, run, ["research"], {
          research: [...search, ...github],
        });
        org = result.org;
        run = await transition(deps.store, result.run, "feasibility");
        break;
      }
      case "feasibility": {
        const result = await runTypedTasks(deps, org, run, ["strategy", "engineering", "finance"]);
        org = result.org;
        run = await transition(deps.store, result.run, "debate");
        break;
      }
      case "debate":
        run = await createDecision(deps, org, run);
        break;
      case "decision":
        run = await transition(deps.store, run, "build_plan");
        break;
      case "build_plan":
        run = await transition(deps.store, run, "content_plan");
        break;
      case "content_plan": {
        const result = await runTypedTasks(deps, org, run, ["marketing", "social_media"]);
        org = result.org;
        await createCampaign(deps, org, result.run);
        run = await transition(deps.store, result.run, "media_generation");
        break;
      }
      case "media_generation": {
        const result = await generateCampaignMedia(deps, org, run);
        org = result.org;
        run = await transition(deps.store, result.run, "review");
        break;
      }
      case "review": {
        const items = await deps.store.listContentItems(org.id);
        for (const item of items) {
          await requestApproval(deps.store, {
            organizationId: org.id,
            runId: run.id,
            actionType: "publish_social_post",
            targetId: item.id,
            summary: `Publish ${item.platform} post: ${item.title}`,
            payload: { platform: item.platform },
            autoGrant: org.autoPublish,
          });
        }
        const evalResult = await runTypedTasks(deps, org, run, ["evaluator"]);
        org = evalResult.org;
        run = evalResult.run;
        await finishEvaluation(deps, org, run);
        return evalResult.run;
      }
      case "approval":
      case "scheduled":
        return run;
      case "published":
        run = await finishEvaluation(deps, org, run);
        return run;
      default:
        return run;
    }

    org = (await deps.store.getOrganization(org.id))!;
    run = (await deps.store.getRun(run.id))!;
  }

  return run;
}

export async function createRun(deps: OrchestratorDeps, organizationId: string): Promise<Run> {
  const org = await deps.store.getOrganization(organizationId);
  if (!org) throw new Error("Organization not found");
  const run = await deps.store.createRun({
    id: createId(),
    organizationId,
    status: "intake",
    stepCount: 0,
    costCents: 0,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    cancelled: false,
    demoMode: process.env.DEMO_MODE === "true" || !process.env.LLM_API_KEY,
    caps: defaultRunCaps(),
  });
  await appendEvent(deps.store, {
    organizationId,
    runId: run.id,
    type: "run.created",
    summary: "Rivera run created",
  });
  return run;
}

export async function createAndStartRun(deps: OrchestratorDeps, organizationId: string): Promise<Run> {
  const run = await createRun(deps, organizationId);
  return runOrganization(run.id, deps);
}
