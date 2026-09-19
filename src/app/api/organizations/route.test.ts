import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "@/lib/store";
import { GET, POST } from "./route";
import { GET as getOrg } from "./[id]/route";

const validBody = {
  goal: "Build a developer tool that helps Stellar developers debug Soroban transactions",
  targetUser: "Soroban developers",
  deadline: "2026-10-19",
  budgetUsd: 500,
  technology: "TypeScript, Next.js, Stellar SDK",
};

describe("phase 1 organization API", () => {
  beforeEach(() => {
    resetStore();
  });

  it("persists an organization and writes a created event", async () => {
    const created = await POST(
      new Request("http://rivera.test/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );
    expect(created.status).toBe(201);
    const payload = await created.json();
    expect(payload.organization.goal).toContain("Soroban");
    expect(payload.organization.budgetCents).toBe(50000);

    const read = await getOrg(new Request("http://rivera.test"), {
      params: Promise.resolve({ id: payload.organization.id }),
    });
    expect(read.status).toBe(200);
    const again = await read.json();
    expect(again.organization.id).toBe(payload.organization.id);

    const list = await GET();
    const listed = await list.json();
    expect(listed.organizations).toHaveLength(1);

    const { getStore } = await import("@/lib/store");
    const events = await (await getStore()).listEvents(payload.organization.id);
    expect(events.some((event) => event.type === "organization.created")).toBe(true);
  });

  it("rejects invalid intake", async () => {
    const response = await POST(
      new Request("http://rivera.test/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validBody, budgetUsd: -4 }),
      }),
    );
    expect(response.status).toBe(400);
  });
});
