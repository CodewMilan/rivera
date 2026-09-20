import { describe, expect, it } from "vitest";
import { compileBuildBrief } from "./brief";
import type { Organization, Task } from "@/types";

const org: Organization = {
  id: "org_1",
  name: "Trace",
  goal: "Help Soroban developers debug transactions",
  domain: "developer-tools",
  targetUser: "Soroban developers",
  technology: "TypeScript, Next.js, Stellar SDK",
  preferredChannels: ["x"],
  hiringRoles: [],
  autoPublish: false,
  budgetCents: 50000,
  budgetUsedCents: 0,
  deadline: "2026-10-19",
  status: "active",
  createdAt: "2026-09-19T00:00:00.000Z",
};

function task(agentType: string, patch: Record<string, unknown> = {}): Task {
  return {
    id: `task_${agentType}`,
    organizationId: org.id,
    runId: "run_1",
    agentId: `agent_${agentType}`,
    title: agentType,
    description: agentType,
    dependencies: [],
    status: "done",
    input: {},
    output: {
      agentType,
      status: "success",
      summary: "",
      findings: [`${agentType} finding`],
      evidence: [],
      risks: [`${agentType} risk`],
      recommendation: `${agentType} recommendation`,
      confidence: 0.7,
      artifacts: [],
      estimatedCostCents: 0,
      ...patch,
    },
    createdAt: "2026-09-19T00:00:00.000Z",
    updatedAt: "2026-09-19T00:00:00.000Z",
  } as Task;
}

describe("compileBuildBrief", () => {
  it("packs research, strategy, and engineering into a Cursor-ready brief", () => {
    const brief = compileBuildBrief({
      organization: org,
      tasks: [task("research"), task("strategy"), task("engineering")],
      repoFullName: "milan/trace",
      branch: "main",
    });
    expect(brief).toContain("Trace: 30-day MVP build");
    expect(brief).toContain("Soroban developers");
    expect(brief).toContain("strategy recommendation");
    expect(brief).toContain("engineering recommendation");
    expect(brief).toContain("milan/trace");
    expect(brief).toContain("Do NOT do this");
  });

  it("still produces a brief when specialist outputs are missing", () => {
    const brief = compileBuildBrief({ organization: org, tasks: [] });
    expect(brief).toContain("Trace: 30-day MVP build");
    expect(brief).toContain("Do this");
  });
});
