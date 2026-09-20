import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishContent, reviewContent } from "@/lib/content/actions";
import { createId } from "@/lib/ids";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { DemoSocialPublisher, XSocialPublisher, createSocialPublisher } from "@/lib/providers/social";
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
    const published = await publishContent(store, new DemoSocialPublisher(), item.id, "now");
    expect(published.status).toBe("published");
    expect(published.demoPublished).toBe(true);
    const events = await store.listEvents(org.id);
    expect(events.some((event) => event.summary.includes("Demo mode: publishing simulated"))).toBe(true);
  });

  it("signs live publishes with user-context OAuth, not a Bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "1901" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const publisher = new XSocialPublisher({
      apiKey: "consumer",
      apiSecret: "consumer-secret",
      accessToken: "user-token",
      accessTokenSecret: "user-secret",
    });
    const posted = await publisher.publish({
      platform: "x",
      text: "Trace: decode the failed tx.",
      mediaUrls: [],
      approvalId: "approval_1",
    });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as { Authorization?: string };
    expect(headers.Authorization).toMatch(/^OAuth /);
    expect(headers.Authorization).toContain("oauth_token=");
    expect(headers.Authorization).not.toMatch(/Bearer/);
    expect(posted.url).toBe("https://x.com/i/web/status/1901");
    expect(posted.demo).toBe(false);
    vi.unstubAllGlobals();
  });

  it("stays in demo when user-context X tokens are missing", () => {
    expect(createSocialPublisher()).toBeInstanceOf(DemoSocialPublisher);
  });
});
