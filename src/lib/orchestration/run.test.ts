import { beforeEach, describe, expect, it } from "vitest";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { FakeLLMProvider } from "@/lib/providers/llm";
import { FakeHiggsfieldProvider } from "@/lib/providers/higgsfield";
import { FakeSearchProvider } from "@/lib/tools/search";
import { createMemoryStore, resetStore } from "@/lib/store";
import { createAndStartRun, defaultRunCaps, runOrganization } from "./run";
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
    expect(agents.length).toBeGreaterThanOrEqual(8);
    expect(tasks.length).toBeGreaterThanOrEqual(5);
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
