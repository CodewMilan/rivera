import { beforeEach, describe, expect, it } from "vitest";
import { decideApproval, requestApproval } from "@/lib/approvals/engine";
import { publishContent, reviewContent } from "@/lib/content/actions";
import { createId } from "@/lib/ids";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { DemoSocialPublisher } from "@/lib/providers/social";
import { createMemoryStore, resetStore } from "@/lib/store";

describe("phase 6 social publisher", () => {
  beforeEach(() => {
    resetStore();
  });

  it("labels demo publishes and refuses to look real", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const item = await store.createContentItem({
      id: createId(),
      campaignId: createId(),
      organizationId: org.id,
      platform: "x",
      type: "text",
      title: "Launch",
      hook: "See the failed tx",
      caption: "Trace is a local Soroban debugger.",
      hashtags: ["#Stellar"],
      claimsUsed: ["local-first"],
      mediaAssetIds: [],
      status: "review",
    });
    await reviewContent(store, item.id, "approve");
    const approval = await requestApproval(store, {
      organizationId: org.id,
      actionType: "publish_social_post",
      targetId: item.id,
      summary: "Publish X",
    });
    await decideApproval(store, approval.id, "approved");
    const published = await publishContent(store, new DemoSocialPublisher(), item.id, "now");
    expect(published.status).toBe("published");
    expect(published.demoPublished).toBe(true);
    const events = await store.listEvents(org.id);
    expect(events.some((event) => event.summary.includes("Demo mode: publishing simulated"))).toBe(true);
  });
});
