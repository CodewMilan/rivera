import { describe, expect, it } from "vitest";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { buildHomeOverview, formatDuration, relativeTime } from "./overview";
import { createMemoryStore } from "@/lib/store";
import { nowIso } from "@/lib/clock";

describe("home overview", () => {
  it("uses real task and run stats instead of stock numbers", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(
      store,
      {
        name: "Trace",
        goal: "Build a developer tool that helps Stellar developers debug Soroban transactions",
        deadline: "2026-10-19",
        budgetUsd: 500,
      },
      { ownerUserId: "user_1" },
    );
    await store.createRun({
      id: "run-1",
      organizationId: org.id,
      status: "review",
      stepCount: 8,
      costCents: 120,
      startedAt: new Date(Date.now() - 4 * 60 * 1000 - 12 * 1000).toISOString(),
      updatedAt: nowIso(),
      cancelled: false,
      demoMode: true,
      caps: { maxSteps: 24, maxCostCents: 20000, maxDurationMs: 1000, maxRetries: 1 },
    });
    await store.createAgent({
      id: "agent-1",
      organizationId: org.id,
      type: "ceo",
      name: "CEO / Orchestrator",
      objective: "Coordinate",
      tools: [],
      permissions: [],
      budgetCents: 1000,
      spentCents: 10,
      status: "idle",
      lastAction: "Staffed the org",
    });
    await store.createTask({
      id: "task-1",
      organizationId: org.id,
      runId: "run-1",
      agentId: "agent-1",
      title: "Research the problem",
      description: "Find evidence",
      dependencies: [],
      status: "done",
      input: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await store.createTask({
      id: "task-2",
      organizationId: org.id,
      runId: "run-1",
      agentId: "agent-1",
      title: "Draft posts",
      description: "Write captions",
      dependencies: [],
      status: "failed",
      input: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    const overview = await buildHomeOverview(store, { userId: "user_1" });
    expect(overview.selected?.metrics.tasksThisWeek).toBe(2);
    expect(overview.selected?.metrics.taskSuccessRate).toBe("50%");
    expect(overview.selected?.metrics.avgRunTime).toBe("4m 12s");
    expect(overview.selected?.agents[0]?.name).toContain("CEO");
    expect(overview.selected?.runs[0]?.status).toBe("review");
  });

  it("prefers the signed-in user's organizations", async () => {
    const store = createMemoryStore();
    await createOrganizationFromIntake(store, {
      goal: "Build a developer tool that helps Stellar developers debug Soroban",
      deadline: "2026-10-19",
      budgetUsd: 500,
      name: "Other",
    });
    const mine = await createOrganizationFromIntake(
      store,
      {
        goal: "Build a hiring copilot for founding engineers in 30 days",
        deadline: "2026-10-19",
        budgetUsd: 400,
        name: "Mine",
      },
      { ownerUserId: "user_1" },
    );
    const overview = await buildHomeOverview(store, { userId: "user_1" });
    expect(overview.organizations).toHaveLength(1);
    expect(overview.selected?.id).toBe(mine.id);
  });

  it("formats compact relative times", () => {
    expect(relativeTime(new Date(Date.now() - 12 * 60 * 1000).toISOString())).toBe("12m ago");
    expect(formatDuration(9 * 60 * 1000 + 21 * 1000)).toBe("9m 21s");
  });
});
