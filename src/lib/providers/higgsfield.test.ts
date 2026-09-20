import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyMediaWebhook, createStandaloneMediaJob, settleMediaJob } from "@/lib/media/jobs";
import { createMemoryStore, resetStore } from "@/lib/store";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { isPersistableMediaUrl, setMediaPersister } from "@/lib/storage/s3";
import { FakeHiggsfieldProvider, verifyHiggsfieldSignature } from "./higgsfield";

describe("phase 3 Higgsfield adapter", () => {
  beforeEach(() => {
    resetStore();
    setMediaPersister(null);
  });

  afterEach(() => {
    setMediaPersister(null);
  });

  it("creates an async-shaped job and can complete it", async () => {
    const provider = new FakeHiggsfieldProvider();
    const created = await provider.createImage({
      prompt: "CLI screenshot on stone",
      type: "image",
      costCeilingCents: 40,
    });
    expect(created.providerJobId).toMatch(/^hf_/);
    expect(["queued", "processing", "completed"]).toContain(created.status);
    const status = await provider.getStatus(created.providerJobId);
    expect(status.outputUrl).toBeTruthy();
  });

  it("enforces a cost ceiling", async () => {
    const provider = new FakeHiggsfieldProvider();
    await expect(
      provider.createVideo({ prompt: "demo", type: "video", costCeilingCents: 10 }),
    ).rejects.toThrow(/cost ceiling/);
  });

  it("verifies webhook signatures", () => {
    const body = JSON.stringify({ request_id: "abc", status: "completed" });
    const secret = "whsec";
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyHiggsfieldSignature(body, signature, secret)).toBe(true);
    expect(verifyHiggsfieldSignature(body, "nope", secret)).toBe(false);
  });

  it("applies webhook updates idempotently", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const provider = new FakeHiggsfieldProvider();
    const job = await createStandaloneMediaJob(store, provider, {
      organizationId: org.id,
      prompt: "launch still",
      type: "image",
    });
    const first = await applyMediaWebhook(store, {
      request_id: job.providerJobId,
      status: "completed",
      images: [{ url: "https://files.rivera.test/demo/launch.jpg" }],
    });
    const second = await applyMediaWebhook(store, {
      request_id: job.providerJobId,
      status: "completed",
      images: [{ url: "https://files.rivera.test/demo/launch.jpg" }],
    });
    expect(first.id).toBe(second.id);
    expect(first.outputAssetId).toBe(second.outputAssetId);
  });

  it("polls a queued job until it completes", async () => {
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const provider = new FakeHiggsfieldProvider({ completeImmediately: false });
    const job = await createStandaloneMediaJob(store, provider, {
      organizationId: org.id,
      prompt: "queued still",
      type: "image",
    });
    expect(job.status).toBe("queued");
    provider.complete(job.providerJobId);
    const settled = await settleMediaJob(store, provider, job);
    expect(settled.status).toBe("completed");
    expect(settled.outputAssetId).toBeTruthy();
  });

  it("copies remote media into object storage when a persister is configured", async () => {
    setMediaPersister(async ({ sourceUrl, assetId }) =>
      isPersistableMediaUrl(sourceUrl) ? `https://cdn.rivera.test/${assetId}` : sourceUrl,
    );
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const provider = new FakeHiggsfieldProvider({ completeImmediately: false });
    const job = await createStandaloneMediaJob(store, provider, {
      organizationId: org.id,
      prompt: "remote still",
      type: "image",
    });
    const completed = await applyMediaWebhook(store, {
      request_id: job.providerJobId,
      status: "completed",
      images: [{ url: "https://files.higgsfield.test/launch.jpg" }],
    });
    const asset = await store.getAsset(completed.outputAssetId!);
    expect(asset?.url).toBe(`https://cdn.rivera.test/${asset?.id}`);
    expect(completed.outputUrl).toBe(asset?.url);
  });

  it("keeps the provider URL if object storage persist fails", async () => {
    setMediaPersister(async () => {
      throw new Error("S3 down");
    });
    const store = createMemoryStore();
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    const provider = new FakeHiggsfieldProvider({ completeImmediately: false });
    const job = await createStandaloneMediaJob(store, provider, {
      organizationId: org.id,
      prompt: "fallback still",
      type: "image",
    });
    const completed = await applyMediaWebhook(store, {
      request_id: job.providerJobId,
      status: "completed",
      images: [{ url: "https://files.higgsfield.test/launch.jpg" }],
    });
    const asset = await store.getAsset(completed.outputAssetId!);
    expect(asset?.url).toBe("https://files.higgsfield.test/launch.jpg");
  });
});
