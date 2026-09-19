import { nowIso } from "@/lib/clock";
import { appendEvent } from "@/lib/events/log";
import { createId } from "@/lib/ids";
import { requestApproval } from "@/lib/approvals/engine";
import type { MediaProvider } from "@/lib/providers/higgsfield";
import type { Store } from "@/lib/store";
import type { MediaJob } from "@/types";

export async function createStandaloneMediaJob(
  store: Store,
  media: MediaProvider,
  input: {
    organizationId: string;
    prompt: string;
    type: "image" | "video";
    contentItemId?: string;
    costCeilingCents?: number;
  },
): Promise<MediaJob> {
  const ceiling = input.costCeilingCents ?? (input.type === "video" ? 80 : 40);
  if (ceiling >= 2500) {
    await requestApproval(store, {
      organizationId: input.organizationId,
      actionType: "spend_budget",
      targetId: `media:${input.prompt.slice(0, 24)}`,
      summary: `Spend $${(ceiling / 100).toFixed(2)} on ${input.type} generation`,
      payload: { prompt: input.prompt, cents: ceiling },
    });
  }

  const created =
    input.type === "video"
      ? await media.createVideo({
          prompt: input.prompt,
          type: "video",
          costCeilingCents: Math.max(ceiling, 40),
          webhookUrl: process.env.HIGGSFIELD_WEBHOOK_URL,
        })
      : await media.createImage({
          prompt: input.prompt,
          type: "image",
          costCeilingCents: Math.max(ceiling, 25),
          webhookUrl: process.env.HIGGSFIELD_WEBHOOK_URL,
        });

  const job = await store.createMediaJob({
    id: createId(),
    organizationId: input.organizationId,
    contentItemId: input.contentItemId,
    provider: "higgsfield",
    providerJobId: created.providerJobId,
    type: input.type,
    prompt: input.prompt,
    inputAssetIds: [],
    status: created.status,
    outputUrl: created.outputUrl,
    previewUrl: created.previewUrl,
    estimatedCostCents: created.estimatedCostCents,
    actualCostCents: created.status === "completed" ? created.estimatedCostCents : undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  if (created.status === "completed" && created.outputUrl) {
    const asset = await store.createAsset({
      id: createId(),
      organizationId: input.organizationId,
      url: created.outputUrl,
      previewUrl: created.previewUrl,
      kind: input.type,
      provider: "higgsfield",
      createdAt: nowIso(),
    });
    await store.updateMediaJob(job.id, { outputAssetId: asset.id });
    if (input.contentItemId) {
      const item = await store.getContentItem(input.contentItemId);
      if (item) {
        await store.updateContentItem(item.id, {
          mediaAssetIds: [...item.mediaAssetIds, asset.id],
        });
      }
    }
  }

  await appendEvent(store, {
    organizationId: input.organizationId,
    type: created.status === "completed" ? "media.job.completed" : "media.job.created",
    summary: `Standalone ${input.type} job ${created.status}`,
    payload: { jobId: job.id },
  });

  return (await store.getMediaJob(job.id))!;
}

export async function applyMediaWebhook(
  store: Store,
  payload: {
    request_id?: string;
    status?: string;
    images?: Array<{ url?: string }>;
    video?: { url?: string };
    error?: string;
  },
): Promise<MediaJob> {
  const providerJobId = payload.request_id;
  if (!providerJobId) throw Object.assign(new Error("Missing request_id"), { status: 400 });
  const existing = await store.getMediaJobByProviderId(providerJobId);
  if (!existing) throw Object.assign(new Error("Unknown media job"), { status: 404 });

  const status =
    payload.status === "completed"
      ? "completed"
      : payload.status === "failed" || payload.status === "nsfw"
        ? "failed"
        : payload.status === "processing"
          ? "processing"
          : existing.status;
  const outputUrl = payload.video?.url ?? payload.images?.[0]?.url ?? existing.outputUrl;

  if (existing.status === "completed" && status === "completed") {
    return existing;
  }

  let outputAssetId = existing.outputAssetId;
  if (status === "completed" && outputUrl && !outputAssetId) {
    const asset = await store.createAsset({
      id: createId(),
      organizationId: existing.organizationId,
      url: outputUrl,
      previewUrl: payload.images?.[0]?.url ?? outputUrl,
      kind: existing.type === "video" ? "video" : "image",
      provider: "higgsfield",
      createdAt: nowIso(),
    });
    outputAssetId = asset.id;
    if (existing.contentItemId) {
      const item = await store.getContentItem(existing.contentItemId);
      if (item) {
        await store.updateContentItem(item.id, {
          mediaAssetIds: [...item.mediaAssetIds, asset.id],
          status: item.status === "draft" ? "review" : item.status,
        });
      }
    }
  }

  const next = await store.updateMediaJob(existing.id, {
    status,
    outputUrl,
    outputAssetId,
    error: payload.error,
    updatedAt: nowIso(),
  });

  await appendEvent(store, {
    organizationId: existing.organizationId,
    type: status === "completed" ? "media.job.completed" : "media.job.updated",
    summary: `Higgsfield job ${status}`,
    payload: { jobId: existing.id, providerJobId, idempotent: existing.status === status },
  });

  return next;
}
