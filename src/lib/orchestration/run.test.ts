import { beforeEach, describe, expect, it } from "vitest";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { FakeLLMProvider, defaultDemoResponder } from "@/lib/providers/llm";
import { FakeHiggsfieldProvider } from "@/lib/providers/higgsfield";
import { FakeSearchProvider } from "@/lib/tools/search";
import { createMemoryStore, resetStore } from "@/lib/store";
import { createAndStartRun, createRun, defaultRunCaps, runHiringForOrganization, runOrganization } from "./run";
import { nowIso } from "@/lib/clock";
import { createId } from "@/lib/ids";

function intake() {
  return {
    goal: "Build a developer tool that helps Stellar developers debug Soroban transactions",
    deadline: "2026-10-19",
    budgetUsd: 500,
    targetUser: "Soroban developers",
  };
}

describe("phase 2 orchestrator", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates a run without executing the full loop", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    const run = await createRun(
      {
        store,
        llm: new FakeLLMProvider(() => "{not-json"),
        search: new FakeSearchProvider(),
        media: new FakeHiggsfieldProvider(),
      },
      org.id,
    );
    expect(run.status).toBe("intake");
    expect(await store.listAgents(org.id)).toHaveLength(0);
  });

  it("creates agents, tasks, and events from a CEO plan", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    const run = await createAndStartRun(
      {
        store,
        llm: new FakeLLMProvider(() => "{not-json"),
        search: new FakeSearchProvider(),
        media: new FakeHiggsfieldProvider(),
      },
      org.id,
    );

    const agents = await store.listAgents(org.id);
    const tasks = await store.listTasks(org.id);
    const events = await store.listEvents(org.id);
    expect(agents.some((agent) => agent.type === "ceo")).toBe(true);
    expect(agents.length).toBe(8);
    expect(tasks).toHaveLength(7);
    expect(events.some((event) => event.type === "agent.created")).toBe(true);
    expect(events.some((event) => event.type === "task.assigned")).toBe(true);
    expect(["review", "approval", "complete"]).toContain(run.status);
  });

  it("retries malformed CEO JSON then falls back instead of crashing", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    const run = await createAndStartRun(
      {
        store,
        llm: new FakeLLMProvider(() => "definitely not json"),
        search: new FakeSearchProvider(),
        media: new FakeHiggsfieldProvider(),
      },
      org.id,
    );
    expect(run.status).not.toBe("failed");
    expect((await store.listAgents(org.id)).length).toBeGreaterThan(0);
  });

  it("stops at max steps", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    const run = await store.createRun({
      id: createId(),
      organizationId: org.id,
      status: "intake",
      stepCount: 0,
      costCents: 0,
      startedAt: nowIso(),
      updatedAt: nowIso(),
      cancelled: false,
      demoMode: true,
      caps: { ...defaultRunCaps(), maxSteps: 0 },
    });
    const next = await runOrganization(run.id, {
      store,
      llm: new FakeLLMProvider(() => "{}"),
      search: new FakeSearchProvider(),
      media: new FakeHiggsfieldProvider(),
    });
    expect(next.status).toBe("failed");
    expect(next.error).toMatch(/step count/);
  });

  it("returns immediately when a human approval is already pending", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    const { requestApproval } = await import("@/lib/approvals/engine");
    await requestApproval(store, {
      organizationId: org.id,
      actionType: "spend_budget",
      targetId: "media-1",
      summary: "Spend on video",
    });
    const run = await createAndStartRun(
      {
        store,
        llm: new FakeLLMProvider(() => "not-json"),
        search: new FakeSearchProvider(),
        media: new FakeHiggsfieldProvider(),
      },
      org.id,
    );
    expect(run.status).toBe("intake");
    expect(await store.listAgents(org.id)).toHaveLength(0);
  });

  it("stops when cancelled", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    const run = await store.createRun({
      id: createId(),
      organizationId: org.id,
      status: "intake",
      stepCount: 0,
      costCents: 0,
      startedAt: nowIso(),
      updatedAt: nowIso(),
      cancelled: true,
      demoMode: true,
      caps: defaultRunCaps(),
    });
    const next = await runOrganization(run.id, {
      store,
      llm: new FakeLLMProvider(() => "{}"),
      search: new FakeSearchProvider(),
      media: new FakeHiggsfieldProvider(),
    });
    expect(next.status).toBe("cancelled");
  });
});

describe("phase 3 demo tools", () => {
  beforeEach(() => {
    resetStore();
  });

  it("uses labeled specialist fixtures, search, calculator, and media assets", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    await createAndStartRun(
      {
        store,
        llm: new FakeLLMProvider(defaultDemoResponder),
        search: new FakeSearchProvider(),
        media: new FakeHiggsfieldProvider(),
      },
      org.id,
    );

    const research = (await store.listAgents(org.id)).find((agent) => agent.type === "research");
    expect(research?.lastAction).toMatch(/Soroban|debugging/i);
    expect(research?.lastAction).not.toMatch(/Demo completion for/);

    const events = await store.listEvents(org.id);
    expect(events.some((event) => event.summary.includes("webSearch"))).toBe(true);
    expect(events.some((event) => event.summary.includes("calculator"))).toBe(true);

    const scored = (await store.listTasks(org.id)).filter((task) => task.evaluation?.score);
    expect(scored.length).toBeGreaterThan(0);

    const hiring = (await store.listTasks(org.id)).find((task) => task.title === "Shortlist hires");
    expect(hiring?.status).toBe("done");
    expect((await store.getOrganization(org.id))?.hiringRoles?.length).toBeGreaterThan(0);
    expect((await store.listEvents(org.id)).some((event) => event.summary.includes("candidates"))).toBe(true);

    const items = await store.listContentItems(org.id);
    expect(items.some((item) => item.mediaAssetIds.length > 0)).toBe(true);
  });

  it("finishes a leftover blocked hiring task after the run already completed", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    const deps = {
      store,
      llm: new FakeLLMProvider(defaultDemoResponder),
      search: new FakeSearchProvider(),
      media: new FakeHiggsfieldProvider(),
    };
    await createAndStartRun(deps, org.id);

    const hiring = (await store.listTasks(org.id)).find((task) => task.title === "Shortlist hires");
    expect(hiring).toBeTruthy();
    await store.updateTask(hiring!.id, { status: "blocked", output: undefined });
    await store.updateOrganization(org.id, { hiringRoles: [] });

    await runHiringForOrganization(deps, org.id);

    const next = (await store.listTasks(org.id)).find((task) => task.title === "Shortlist hires");
    expect(next?.status).toBe("done");
    expect((await store.getOrganization(org.id))?.hiringRoles?.length).toBeGreaterThan(0);
  });

  it("staffs hiring on an older org that never had a hiring agent", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, intake());
    const deps = {
      store,
      llm: new FakeLLMProvider(defaultDemoResponder),
      search: new FakeSearchProvider(),
      media: new FakeHiggsfieldProvider(),
    };
    const run = await createRun(deps, org.id);
    await store.updateRun(run.id, { status: "complete" });
    const strategy = await store.createAgent({
      id: createId(),
      organizationId: org.id,
      type: "strategy",
      name: "Strategy",
      objective: "Choose the wedge",
      tools: [],
      permissions: ["draft"],
      budgetCents: 100,
      spentCents: 0,
      status: "idle",
    });
    await store.createTask({
      id: createId(),
      organizationId: org.id,
      runId: run.id,
      agentId: strategy.id,
      title: "Choose the product wedge",
      description: "Pick the first user and the go / no-go call.",
      dependencies: [],
      status: "done",
      input: { goal: org.goal },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    await runHiringForOrganization(deps, org.id);

    expect((await store.listAgents(org.id)).some((agent) => agent.type === "hiring")).toBe(true);
    const hiring = (await store.listTasks(org.id)).find((task) => task.title === "Shortlist hires");
    expect(hiring?.status).toBe("done");
    expect((await store.listEvents(org.id)).some((event) => event.summary.includes("candidates"))).toBe(true);
  });
});

describe("live LLM smoke", () => {
  it.skipIf(!process.env.LIVE || !process.env.LLM_API_KEY)("completes against the real model", async () => {
    const { createLLMProvider } = await import("@/lib/providers/llm");
    const result = await createLLMProvider().complete({
      system: "Return JSON {\"ok\":true}",
      user: "ping",
    });
    expect(result.text.length).toBeGreaterThan(0);
  });
});
