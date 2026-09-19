import { beforeEach, describe, expect, it } from "vitest";
import { decideApproval } from "@/lib/approvals/engine";
import { publishContent, reviewContent } from "@/lib/content/actions";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { createAndStartRun, finishEvaluation } from "@/lib/orchestration/run";
import { FakeHiggsfieldProvider } from "@/lib/providers/higgsfield";
import { FakeLLMProvider } from "@/lib/providers/llm";
import { DemoSocialPublisher } from "@/lib/providers/social";
import { createMemoryStore, resetStore } from "@/lib/store";
import { FakeSearchProvider } from "@/lib/tools/search";

describe("phase 6 hackathon workflow", () => {
  beforeEach(() => {
    resetStore();
  });

  it("runs the Stellar/Soroban prompt through review, one approved publish, and a scored report", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool that helps Stellar developers debug Soroban transactions in 30 days with a $500 budget.",
      targetUser: "Soroban developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
      technology: "TypeScript, Next.js, Stellar SDK",
      preferredChannels: ["x", "linkedin", "instagram", "tiktok"],
    });

    const deps = {
      store,
      llm: new FakeLLMProvider(() => "not-json"),
      search: new FakeSearchProvider(),
      media: new FakeHiggsfieldProvider(),
    };
    const run = await createAndStartRun(deps, org.id);
    expect(["review", "approval", "complete"]).toContain(run.status);

    const items = await store.listContentItems(org.id);
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(new Set(items.map((item) => item.platform)).size).toBeGreaterThanOrEqual(3);
    expect(items.every((item) => item.hook && item.caption)).toBe(true);

    const decisions = await store.listDecisions(org.id);
    expect(decisions[0]?.selectedProposalId).toBeTruthy();
    expect(decisions[0]?.rationale).toMatch(/CLI/i);

    const xPost = items.find((item) => item.platform === "x");
    expect(xPost).toBeTruthy();
    await reviewContent(store, xPost!.id, "approve");
    const approval = (await store.listApprovals(org.id)).find((item) => item.targetId === xPost!.id);
    expect(approval).toBeTruthy();
    if (approval?.status === "pending") {
      await decideApproval(store, approval.id, "approved");
    }
    const published = await publishContent(store, new DemoSocialPublisher(), xPost!.id, "now");
    expect(published.status).toBe("published");
    expect(published.demoPublished).toBe(true);

    const latest = (await store.getRun(run.id))!;
    await store.updateRun(latest.id, { status: "published" });
    await finishEvaluation(deps, (await store.getOrganization(org.id))!, (await store.getRun(run.id))!);
    const report = await store.getReport(org.id);
    expect(report?.opportunityScore).toBeGreaterThan(0);
    expect(report?.budgetFit).toBeGreaterThan(0);

    const events = await store.listEvents(org.id);
    expect(events.some((event) => event.type === "decision.made")).toBe(true);
    expect(events.some((event) => event.type === "approval.requested" || event.type === "approval.granted")).toBe(true);
    expect(events.some((event) => event.type === "content.published")).toBe(true);
  });
});
