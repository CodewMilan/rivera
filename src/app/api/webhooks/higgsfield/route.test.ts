import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { createStandaloneMediaJob } from "@/lib/media/jobs";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { FakeHiggsfieldProvider } from "@/lib/providers/higgsfield";
import { createMemoryStore, resetStore, setStore } from "@/lib/store";
import { POST } from "./route";

describe("phase 3 higgsfield webhook", () => {
  beforeEach(() => {
    resetStore();
    delete process.env.HIGGSFIELD_WEBHOOK_SECRET;
  });

  it("rejects a bad signature when a secret is configured", async () => {
    process.env.HIGGSFIELD_WEBHOOK_SECRET = "secret";
    const response = await POST(
      new Request("http://rivera.test/api/webhooks/higgsfield", {
        method: "POST",
        headers: { "x-higgsfield-signature": "nope" },
        body: JSON.stringify({ request_id: "x", status: "completed" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("accepts a signed completed job", async () => {
    const store = createMemoryStore();
    setStore(store);
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const job = await createStandaloneMediaJob(store, new FakeHiggsfieldProvider(), {
      organizationId: org.id,
      prompt: "still",
      type: "image",
    });
    process.env.HIGGSFIELD_WEBHOOK_SECRET = "secret";
    const body = JSON.stringify({
      request_id: job.providerJobId,
      status: "completed",
      images: [{ url: "https://files.rivera.test/demo/launch.jpg" }],
    });
    const signature = createHmac("sha256", "secret").update(body).digest("hex");
    const response = await POST(
      new Request("http://rivera.test/api/webhooks/higgsfield", {
        method: "POST",
        headers: { "x-higgsfield-signature": signature },
        body,
      }),
    );
    expect(response.status).toBe(200);
  });
});
