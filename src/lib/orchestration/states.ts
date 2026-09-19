import type { RunStatus } from "@/types";

export const TERMINAL_STATUSES: RunStatus[] = ["complete", "failed", "cancelled"];

export const ALLOWED_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  intake: ["planning"],
  planning: ["research", "failed"],
  research: ["feasibility", "failed"],
  feasibility: ["debate", "failed"],
  debate: ["decision", "failed"],
  decision: ["build_plan", "failed"],
  build_plan: ["content_plan", "failed"],
  content_plan: ["media_generation", "review", "complete", "failed"],
  media_generation: ["review", "failed"],
  review: ["approval", "complete", "failed"],
  approval: ["scheduled", "published", "failed"],
  scheduled: ["published", "failed"],
  published: ["evaluation", "failed"],
  evaluation: ["complete", "failed"],
  complete: [],
  failed: [],
  cancelled: [],
};

export function isTerminal(status: RunStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function assertTransition(from: RunStatus, to: RunStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Illegal run transition: ${from} -> ${to}`);
  }
}

export function canTransition(from: RunStatus, to: RunStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
