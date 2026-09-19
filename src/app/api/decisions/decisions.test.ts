import { beforeEach, describe, expect, it } from "vitest";
import { nowIso } from "@/lib/clock";
import { createId } from "@/lib/ids";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { resetStore, getStore } from "@/lib/store";
import { POST as approve } from "./[id]/approve/route";
import { POST as reject } from "./[id]/reject/route";

describe("phase 4 decisions", () => {
  beforeEach(() => {
    resetStore();
  });

  it("cannot close a decision without a selected proposal", async () => {
    const response = await approve(
      new Request("http://rivera.test", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(400);
  });

  it("approves and rejects a decision", async () => {
    const store = await getStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const proposalId = createId();
    const decision = await store.createDecision({
      id: createId(),
      organizationId: org.id,
      runId: createId(),
      question: "CLI or hosted?",
      proposals: [
        {
          id: proposalId,
          agentType: "engineering",
          recommendation: "CLI first",
          evidence: [],
          risks: [],
        },
      ],
      status: "open",
      createdAt: nowIso(),
    });

    const approved = await approve(
      new Request("http://rivera.test", {
        method: "POST",
        body: JSON.stringify({ proposalId }),
      }),
      { params: Promise.resolve({ id: decision.id }) },
    );
    expect(approved.status).toBe(200);
    expect((await approved.json()).decision.status).toBe("approved");

    const rejected = await reject(new Request("http://rivera.test", { method: "POST" }), {
      params: Promise.resolve({ id: decision.id }),
    });
    expect((await rejected.json()).decision.status).toBe("rejected");
  });
});
