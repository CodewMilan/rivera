import { beforeEach, describe, expect, it } from "vitest";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { createMemoryStore, resetStore } from "@/lib/store";
import { decideApproval, hasBlockingApproval, requestApproval } from "./engine";

describe("phase 4 approvals", () => {
  beforeEach(() => {
    resetStore();
  });

  it("pauses the org when an approval is pending", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    await requestApproval(store, {
      organizationId: org.id,
      actionType: "spend_budget",
      targetId: "job-1",
      summary: "Spend $40 on video",
    });
    expect(await hasBlockingApproval(store, org.id)).toBe(true);
  });

  it("cannot approve an expired gate", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const approval = await requestApproval(store, {
      organizationId: org.id,
      actionType: "publish_social_post",
      targetId: "post-1",
      summary: "Publish X post",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    await expect(decideApproval(store, approval.id, "approved")).rejects.toThrow(/expired/);
    expect((await store.getApproval(approval.id))?.status).toBe("expired");
  });

  it("writes grant and reject events", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const approval = await requestApproval(store, {
      organizationId: org.id,
      actionType: "publish_social_post",
      targetId: "post-2",
      summary: "Publish X post",
    });
    await decideApproval(store, approval.id, "approved");
    const events = await store.listEvents(org.id);
    expect(events.some((event) => event.type === "approval.requested")).toBe(true);
    expect(events.some((event) => event.type === "approval.granted")).toBe(true);
  });
});
