import { appendEvent } from "@/lib/events/log";
import { assertApproved, requestApproval } from "@/lib/approvals/engine";
import { createStandaloneMediaJob } from "@/lib/media/jobs";
import { isDemoPublisher, type SocialPublisher } from "@/lib/providers/social";
import type { MediaProvider } from "@/lib/providers/higgsfield";
import type { Store } from "@/lib/store";
import { nowIso } from "@/lib/clock";
import type { ContentItem } from "@/types";
import { assertContentTransition, canPublish } from "./review";

export async function reviewContent(
  store: Store,
  itemId: string,
  action: "approve" | "reject",
): Promise<ContentItem> {
  const item = await store.getContentItem(itemId);
  if (!item) throw Object.assign(new Error("Content item not found"), { status: 404 });
  const nextStatus = action === "approve" ? "approved" : "draft";
  if (item.status !== "review" && !(action === "approve" && item.status === "draft")) {
    assertContentTransition(item.status, nextStatus);
  } else if (item.status === "draft" && action === "approve") {
    assertContentTransition("draft", "review");
  } else {
    assertContentTransition(item.status, nextStatus);
  }
  const from = item.status === "draft" && action === "approve" ? "review" : item.status;
  if (from !== item.status) {
    await store.updateContentItem(itemId, { status: "review" });
  }
  const next = await store.updateContentItem(itemId, { status: nextStatus });
  await appendEvent(store, {
    organizationId: item.organizationId,
    type: action === "approve" ? "content.approved" : "content.rejected",
    summary: `${action === "approve" ? "Approved" : "Rejected"} ${item.platform} post`,
    payload: { contentItemId: itemId },
  });
  return next;
}

export async function regenerateContentMedia(
  store: Store,
  media: MediaProvider,
  itemId: string,
): Promise<ContentItem> {
  const item = await store.getContentItem(itemId);
  if (!item) throw Object.assign(new Error("Content item not found"), { status: 404 });
  const previousAssets = item.mediaAssetIds;
  const job = await createStandaloneMediaJob(store, media, {
    organizationId: item.organizationId,
    prompt: item.hook,
    type: item.type === "text" ? "image" : item.type === "carousel" ? "image" : item.type,
    contentItemId: item.id,
  });
  const updated = await store.getContentItem(itemId);
  if (!updated) throw new Error("Content item not found");
  if (job.outputAssetId) {
    await store.updateContentItem(itemId, {
      mediaAssetIds: [...previousAssets, job.outputAssetId],
      status: "review",
    });
  }
  return (await store.getContentItem(itemId))!;
}

export async function publishContent(
  store: Store,
  publisher: SocialPublisher,
  itemId: string,
  mode: "now" | "schedule",
  scheduledAt?: string,
): Promise<ContentItem> {
  const item = await store.getContentItem(itemId);
  if (!item) throw Object.assign(new Error("Content item not found"), { status: 404 });
  const org = await store.getOrganization(item.organizationId);
  if (!org) throw Object.assign(new Error("Organization not found"), { status: 404 });

  let approval;
  try {
    approval = await assertApproved(store, org.id, item.id, "publish_social_post");
  } catch (error) {
    if (org.autoPublish) {
      approval = await requestApproval(store, {
        organizationId: org.id,
        actionType: "publish_social_post",
        targetId: item.id,
        summary: `Auto-publish ${item.platform} post`,
        autoGrant: true,
      });
    } else {
      throw error;
    }
  }

  if (!canPublish(item, true, org.autoPublish)) {
    throw Object.assign(new Error("Content must be approved before publishing"), { status: 403 });
  }

  const assets = await store.listAssets(org.id);
  const mediaUrls = item.mediaAssetIds
    .map((id) => assets.find((asset) => asset.id === id)?.url)
    .filter((url): url is string => Boolean(url));

  const result =
    mode === "schedule"
      ? await publisher.schedule({
          platform: item.platform,
          text: `${item.hook}\n\n${item.caption}`,
          mediaUrls,
          approvalId: approval.id,
          scheduledAt: scheduledAt ?? nowIso(),
        })
      : await publisher.publish({
          platform: item.platform,
          text: `${item.hook}\n\n${item.caption}`,
          mediaUrls,
          approvalId: approval.id,
        });

  const demo = result.demo || isDemoPublisher(publisher);
  const next = await store.updateContentItem(itemId, {
    status: mode === "schedule" ? "scheduled" : "published",
    scheduledAt: mode === "schedule" ? scheduledAt ?? nowIso() : item.scheduledAt,
    publishedAt: mode === "now" ? nowIso() : undefined,
    demoPublished: demo,
  });

  await appendEvent(store, {
    organizationId: org.id,
    type: mode === "schedule" ? "content.scheduled" : "content.published",
    summary: demo
      ? `Demo mode: publishing simulated for ${item.platform}`
      : `Published ${item.platform} post`,
    payload: { contentItemId: itemId, demo, url: result.url },
  });

  return next;
}
