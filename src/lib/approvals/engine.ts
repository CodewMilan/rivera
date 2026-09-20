import { isExpired, nowIso } from "@/lib/clock";
import { createId } from "@/lib/ids";
import { appendEvent } from "@/lib/events/log";
import type { Store } from "@/lib/store";
import type { Approval, ApprovalActionType, ApprovalStatus } from "@/types";

const RISKY_ACTIONS: ApprovalActionType[] = [
  "publish_social_post",
  "schedule_social_post",
  "spend_budget",
  "deploy_production",
  "send_external_message",
];

export function requiresApproval(actionType: ApprovalActionType): boolean {
  return RISKY_ACTIONS.includes(actionType);
}

export async function requestApproval(
  store: Store,
  input: {
    organizationId: string;
    runId?: string;
    actionType: ApprovalActionType;
    targetId: string;
    summary: string;
    payload?: unknown;
    expiresAt?: string;
    autoGrant?: boolean;
  },
): Promise<Approval> {
  const existing = await store.findApproval(input.organizationId, input.targetId, input.actionType);
  if (existing && (existing.status === "pending" || existing.status === "approved") && !isExpired(existing.expiresAt)) {
    return existing;
  }
  const approval = await store.createApproval({
    id: createId(),
    organizationId: input.organizationId,
    runId: input.runId,
    actionType: input.actionType,
    targetId: input.targetId,
    summary: input.summary,
    payload: input.payload ?? {},
    status: input.autoGrant ? "approved" : "pending",
    createdAt: nowIso(),
    decidedAt: input.autoGrant ? nowIso() : undefined,
    expiresAt: input.expiresAt,
  });
  await appendEvent(store, {
    organizationId: input.organizationId,
    runId: input.runId,
    type: input.autoGrant ? "approval.granted" : "approval.requested",
    summary: input.autoGrant ? `Auto-granted: ${input.summary}` : `Approval required: ${input.summary}`,
    payload: { approvalId: approval.id, actionType: input.actionType },
  });
  return approval;
}

export async function decideApproval(
  store: Store,
  approvalId: string,
  status: Extract<ApprovalStatus, "approved" | "rejected">,
): Promise<Approval> {
  const approval = await store.getApproval(approvalId);
  if (!approval) throw new Error("Approval not found");
  if (approval.status !== "pending") throw new Error("Approval is no longer pending");
  if (isExpired(approval.expiresAt)) {
    await store.updateApproval(approvalId, { status: "expired" });
    throw new Error("Approval has expired");
  }
  const next = await store.updateApproval(approvalId, {
    status,
    decidedAt: nowIso(),
  });
  await appendEvent(store, {
    organizationId: approval.organizationId,
    runId: approval.runId,
    type: status === "approved" ? "approval.granted" : "approval.rejected",
    summary: status === "approved" ? `Approved: ${approval.summary}` : `Rejected: ${approval.summary}`,
    payload: { approvalId },
  });
  return next;
}

export async function assertApproved(
  store: Store,
  organizationId: string,
  targetId: string,
  actionType: ApprovalActionType,
): Promise<Approval> {
  const approval = await store.findApproval(organizationId, targetId, actionType);
  if (!approval || approval.status !== "approved") {
    throw Object.assign(new Error("This action requires an approved human gate"), { status: 403 });
  }
  if (isExpired(approval.expiresAt)) {
    await store.updateApproval(approval.id, { status: "expired" });
    throw Object.assign(new Error("Approval has expired"), { status: 403 });
  }
  return approval;
}

export async function hasBlockingApproval(store: Store, organizationId: string): Promise<boolean> {
  const pending = await store.listPendingApprovals(organizationId);
  return pending.some((item) => !isExpired(item.expiresAt));
}
