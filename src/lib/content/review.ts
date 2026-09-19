import type { ContentItem, ContentStatus } from "@/types";

const REVIEW_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ["review", "failed"],
  review: ["approved", "draft", "failed"],
  approved: ["scheduled", "published", "review", "failed"],
  scheduled: ["published", "failed"],
  published: [],
  failed: ["review"],
};

export function canChangeContent(from: ContentStatus, to: ContentStatus): boolean {
  return REVIEW_TRANSITIONS[from].includes(to);
}

export function assertContentTransition(from: ContentStatus, to: ContentStatus): void {
  if (!canChangeContent(from, to)) {
    throw Object.assign(new Error(`Illegal content transition: ${from} -> ${to}`), { status: 409 });
  }
}

export function canPublish(item: ContentItem, hasApproval: boolean, autoPublish: boolean): boolean {
  if (item.status !== "approved" && item.status !== "scheduled") return false;
  return hasApproval || autoPublish;
}

export function reviewActionTarget(action: "approve" | "reject" | "regenerate"): ContentStatus {
  if (action === "approve") return "approved";
  if (action === "reject") return "draft";
  return "review";
}
