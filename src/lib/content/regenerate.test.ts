import { beforeEach, describe, expect, it } from "vitest";
import { createId } from "@/lib/ids";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { FakeHiggsfieldProvider } from "@/lib/providers/higgsfield";
import { createMemoryStore, resetStore } from "@/lib/store";
import { regenerateContentMedia } from "./actions";

describe("phase 5 media regenerate", () => {
  beforeEach(() => {
    resetStore();
  });

  it("keeps the previous asset until the new job completes and then appends", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const original = await store.createAsset({
      id: createId(),
      organizationId: org.id,
      url: "https://files.rivera.test/old.jpg",
      kind: "image",
      provider: "higgsfield",
      createdAt: new Date().toISOString(),
    });
    const item = await store.createContentItem({
      id: createId(),
      campaignId: createId(),
      organizationId: org.id,
      platform: "instagram",
      type: "image",
      title: "Still",
      hook: "See the failed tx",
      caption: "Trace",
      hashtags: [],
      claimsUsed: [],
      mediaAssetIds: [original.id],
      status: "review",
    });

    const next = await regenerateContentMedia(store, new FakeHiggsfieldProvider(), item.id);
    expect(next.mediaAssetIds).toContain(original.id);
    expect(next.mediaAssetIds.length).toBeGreaterThan(1);
    expect(next.status).toBe("review");
  });
});
