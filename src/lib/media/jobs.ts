import { nowIso } from "@/lib/clock";
import { appendEvent } from "@/lib/events/log";
import { createId } from "@/lib/ids";
import { requestApproval } from "@/lib/approvals/engine";
import type { MediaProvider } from "@/lib/providers/higgsfield";
import { persistMediaUrl } from "@/lib/storage/s3";
import type { Store } from "@/lib/store";
import type { Asset, MediaJob } from "@/types";

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
    const asset = await attachOutputAsset(store, job, {
      outputUrl: created.outputUrl,
      previewUrl: created.previewUrl,
    });
    await store.updateMediaJob(job.id, {
      outputAssetId: asset.id,
      outputUrl: asset.url,
      previewUrl: asset.previewUrl,
    });
  }

  await appendEvent(store, {
    organizationId: input.organizationId,
    type: created.status === "completed" ? "media.job.completed" : "media.job.created",
    summary: `Standalone ${input.type} job ${created.status}`,
    payload: { jobId: job.id },
  });

  return settleMediaJob(store, media, (await store.getMediaJob(job.id))!);
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

  if (existing.status === "completed" && status === "completed" && existing.outputAssetId) {
    return existing;
  }

  let outputAssetId = existing.outputAssetId;
  let durableOutput = outputUrl;
  let durablePreview = payload.images?.[0]?.url ?? existing.previewUrl;
  if (status === "completed" && outputUrl && !outputAssetId) {
    const asset = await attachOutputAsset(store, existing, {
      outputUrl,
      previewUrl: payload.images?.[0]?.url ?? outputUrl,
    });
    outputAssetId = asset.id;
    durableOutput = asset.url;
    durablePreview = asset.previewUrl;
  }

  const next = await store.updateMediaJob(existing.id, {
    status,
    outputUrl: durableOutput,
    previewUrl: durablePreview,
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

export async function settleMediaJob(
  store: Store,
  media: MediaProvider,
  job: MediaJob,
  attempts = 4,
): Promise<MediaJob> {
  if (job.status === "failed") return job;
  if (job.status === "completed" && job.outputAssetId) return job;

  if (job.status === "completed" && job.outputUrl && !job.outputAssetId) {
    return applyMediaWebhook(store, webhookPayload(job, job));
  }

  let current = job;
  const delayMs = process.env.VITEST ? 0 : 400;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await media.getStatus(current.providerJobId);
    if (status.status === "completed" || status.status === "failed") {
      return applyMediaWebhook(store, webhookPayload(current, status));
    }
    current = await store.updateMediaJob(current.id, {
      status: status.status,
      outputUrl: status.outputUrl,
      previewUrl: status.previewUrl,
      error: status.error,
      updatedAt: nowIso(),
    });
    if (delayMs) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return current;
}

async function attachOutputAsset(
  store: Store,
  job: Pick<MediaJob, "organizationId" | "contentItemId" | "type">,
  urls: { outputUrl: string; previewUrl?: string },
): Promise<Asset> {
  const assetId = createId();
  const kind = job.type === "video" ? "video" : "image";
  const url = await durableMediaUrl({
    organizationId: job.organizationId,
    assetId,
    sourceUrl: urls.outputUrl,
    kind,
  });
  const previewSource = urls.previewUrl && urls.previewUrl !== urls.outputUrl ? urls.previewUrl : undefined;
  const previewUrl = previewSource
    ? await durableMediaUrl({
        organizationId: job.organizationId,
        assetId: `${assetId}-preview`,
        sourceUrl: previewSource,
        kind: "image",
      })
    : url;

  const asset = await store.createAsset({
    id: assetId,
    organizationId: job.organizationId,
    url,
    previewUrl,
    kind,
    provider: "higgsfield",
    createdAt: nowIso(),
  });

  if (job.contentItemId) {
    const item = await store.getContentItem(job.contentItemId);
    if (item && !item.mediaAssetIds.includes(asset.id)) {
      await store.updateContentItem(item.id, {
        mediaAssetIds: [...item.mediaAssetIds, asset.id],
        status: item.status === "draft" ? "review" : item.status,
      });
    }
  }

  return asset;
}

async function durableMediaUrl(input: {
  organizationId: string;
  assetId: string;
  sourceUrl: string;
  kind: "image" | "video";
}): Promise<string> {
  try {
    return await persistMediaUrl(input);
  } catch {
    return input.sourceUrl;
  }
}

function webhookPayload(
  job: MediaJob,
  status: { outputUrl?: string; previewUrl?: string; error?: string; status?: string },
) {
  const url = status.outputUrl ?? status.previewUrl ?? job.outputUrl ?? job.previewUrl;
  return {
    request_id: job.providerJobId,
    status: status.status ?? job.status,
    images: url ? [{ url: status.previewUrl ?? url }] : undefined,
    video: job.type === "video" && url ? { url } : undefined,
    error: status.error,
  };
}
