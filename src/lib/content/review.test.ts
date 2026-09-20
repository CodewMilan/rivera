import { beforeEach, describe, expect, it } from "vitest";
import { POST as publish } from "@/app/api/content/items/[id]/publish/route";
import { createId } from "@/lib/ids";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { createMemoryStore, resetStore } from "@/lib/store";
import { reviewContent } from "./actions";
import { canChangeContent } from "./review";

describe("phase 5 content review", () => {
  beforeEach(() => {
    resetStore();
  });

  it("only allows legal review transitions", () => {
    expect(canChangeContent("draft", "review")).toBe(true);
    expect(canChangeContent("review", "approved")).toBe(true);
    expect(canChangeContent("published", "draft")).toBe(false);
  });

  it("returns 403 when publish is called without approval", async () => {
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
    const { setStore } = await import("@/lib/store");
    setStore(store);
    const response = await publish(new Request("http://rivera.test", { method: "POST" }), {
      params: Promise.resolve({ id: item.id }),
    });
    expect(response.status).toBe(403);
  });

  it("lets approve grant the publish gate", async () => {
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
    const { setStore } = await import("@/lib/store");
    setStore(store);
    const response = await publish(new Request("http://rivera.test", { method: "POST" }), {
      params: Promise.resolve({ id: item.id }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.item.status).toBe("published");
  });
});
