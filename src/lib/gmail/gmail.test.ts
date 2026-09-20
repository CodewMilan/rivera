import { describe, expect, it } from "vitest";
import { createOAuthState, parseOAuthState } from "./oauth";
import { keywordScore, launchTerms, scoreInbox } from "./relevance";
import { demoInboxMessages } from "./demo";
import { loadDemoInbox } from "./sync";
import { createMemoryStore } from "@/lib/store";
import { createOrganizationFromIntake } from "@/lib/organizations/create";

describe("gmail oauth state", () => {
  it("round-trips an organization id", () => {
    const { state, nonce } = createOAuthState("org-1");
    expect(parseOAuthState(state, nonce)).toEqual({ organizationId: "org-1" });
  });

  it("rejects a mismatched nonce", () => {
    const { state } = createOAuthState("org-1");
    expect(() => parseOAuthState(state, "nope")).toThrow(/mismatch/i);
  });
});

describe("gmail relevance", () => {
  const org = {
    id: "org-1",
    name: "Trace",
    goal: "Build a developer tool that helps Stellar developers debug Soroban transactions",
    domain: "stellar-developer-tools",
    targetUser: "Soroban developers",
    technology: "TypeScript",
    preferredChannels: ["x" as const],
    hiringRoles: ["Founding Engineer"],
    autoPublish: false,
    budgetCents: 50000,
    budgetUsedCents: 0,
    deadline: "2026-10-19",
    status: "active" as const,
    createdAt: "2026-09-20T00:00:00.000Z",
  };

  it("extracts launch terms and scores demand mail above receipts", async () => {
    expect(launchTerms(org).some((term) => term.includes("soroban") || term.includes("stellar"))).toBe(true);
    const scored = await scoreInbox(org, demoInboxMessages(org));
    const demand = scored.find((item) => item.gmailId === "demo-1");
    const receipt = scored.find((item) => item.gmailId === "demo-3");
    expect(demand?.relevant).toBe(true);
    expect(receipt?.relevant).toBe(false);
    expect(scored.filter((item) => item.relevant).length).toBeGreaterThanOrEqual(2);
  });

  it("treats empty keyword overlap as noise", () => {
    const { score, hits } = keywordScore(["soroban", "stellar"], {
      from: "Stripe <no-reply@stripe.com>",
      subject: "Your receipt",
      snippet: "Invoice paid",
    });
    expect(score).toBe(0);
    expect(hits).toEqual([]);
  });
});

describe("gmail demo sync", () => {
  it("stores relevant sample mail on the organization snapshot", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool that helps Stellar developers debug Soroban transactions",
      deadline: "2026-10-19",
      budgetUsd: 500,
      targetUser: "Soroban developers",
      technology: "TypeScript",
    });
    await loadDemoInbox({ store, org });
    const snapshot = await store.snapshot(org.id);
    expect(snapshot?.inboxMessages.length).toBeGreaterThan(0);
    expect(snapshot?.inboxMessages.some((item) => item.relevant)).toBe(true);
    expect(snapshot?.gmail.connected).toBe(false);
  });
});
