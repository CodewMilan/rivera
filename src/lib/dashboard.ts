import type { AgentType, OrganizationSnapshot, RunStatus } from "@/types";

export const DASHBOARD_TABS = ["now", "work", "launch"] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

export type DashboardEntry =
  | DashboardTab
  | "overview"
  | "agents"
  | "tasks"
  | "timeline"
  | "decisions"
  | "content"
  | "build"
  | "report";

const ENTRY_TO_TAB: Record<DashboardEntry, DashboardTab> = {
  now: "now",
  overview: "now",
  agents: "now",
  work: "work",
  tasks: "work",
  timeline: "work",
  launch: "launch",
  decisions: "launch",
  content: "launch",
  build: "launch",
  report: "launch",
};

const ENTRY_TO_FOCUS: Partial<Record<DashboardEntry, string>> = {
  agents: "team",
  tasks: "tasks",
  timeline: "timeline",
  decisions: "decisions",
  content: "content",
  build: "build",
  report: "report",
};

export function resolveDashboard(entry: DashboardEntry): { tab: DashboardTab; focus: string | null } {
  return {
    tab: ENTRY_TO_TAB[entry] ?? "now",
    focus: ENTRY_TO_FOCUS[entry] ?? null,
  };
}

export function parseDashboardHash(hash: string): { tab: DashboardTab; focus: string | null } | null {
  const value = hash.replace(/^#/, "");
  if (!value) return null;
  if ((DASHBOARD_TABS as readonly string[]).includes(value)) {
    return { tab: value as DashboardTab, focus: null };
  }
  if (value in ENTRY_TO_TAB) {
    return resolveDashboard(value as DashboardEntry);
  }
  return null;
}

export const PHASE_STEPS = [
  { key: "intake", label: "Intake", statuses: ["intake"] },
  { key: "research", label: "Research", statuses: ["planning", "research", "feasibility"] },
  { key: "decide", label: "Decide", statuses: ["debate", "decision"] },
  { key: "plan", label: "Plan", statuses: ["build_plan", "content_plan"] },
  { key: "make", label: "Make", statuses: ["media_generation", "review", "approval", "scheduled", "published"] },
  { key: "report", label: "Report", statuses: ["evaluation", "complete"] },
] as const;

export function phaseStepIndex(status?: RunStatus): number {
  if (!status) return 0;
  if (status === "failed" || status === "cancelled") return -1;
  const index = PHASE_STEPS.findIndex((step) => (step.statuses as readonly string[]).includes(status));
  return index >= 0 ? index : 0;
}

export function deadlineLabel(deadline: string): string {
  const days = Math.round((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(days)) return "No deadline";
  if (days > 1) return `${days} days left`;
  if (days === 1) return "1 day left";
  if (days === 0) return "Due today";
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
}

export function attentionItems(snapshot: OrganizationSnapshot) {
  const blocked = (snapshot.tasks ?? []).filter((task) => task.status === "blocked" || task.status === "approval_required");
  const pending = (snapshot.approvals ?? []).filter((item) => item.status === "pending");
  const review = (snapshot.contentItems ?? []).filter((item) => item.status === "review" || item.status === "draft");
  const openDecisions = (snapshot.decisions ?? []).filter((item) => item.status === "open");
  return { blocked, pending, review, openDecisions };
}

export function attentionCount(snapshot: OrganizationSnapshot): number {
  const items = attentionItems(snapshot);
  return items.blocked.length + items.pending.length + items.review.length + items.openDecisions.length;
}

export function normalizeSnapshot(snapshot: OrganizationSnapshot): OrganizationSnapshot {
  return {
    ...snapshot,
    organization: {
      ...snapshot.organization,
      hiringRoles: snapshot.organization.hiringRoles ?? [],
      preferredChannels: snapshot.organization.preferredChannels ?? [],
    },
    agents: snapshot.agents ?? [],
    tasks: snapshot.tasks ?? [],
    events: snapshot.events ?? [],
    decisions: snapshot.decisions ?? [],
    approvals: snapshot.approvals ?? [],
    campaigns: snapshot.campaigns ?? [],
    contentItems: snapshot.contentItems ?? [],
    mediaJobs: snapshot.mediaJobs ?? [],
    assets: snapshot.assets ?? [],
    inboxMessages: snapshot.inboxMessages ?? [],
    builds: snapshot.builds ?? [],
    gmail: snapshot.gmail ?? { configured: false, connected: false },
    github: snapshot.github ?? { configured: false, connected: false },
  };
}

export const AGENT_META: Record<AgentType, { label: string; hint: string }> = {
  ceo: { label: "CEO", hint: "Runs the org" },
  research: { label: "Research", hint: "Evidence and demand" },
  strategy: { label: "Strategy", hint: "Positioning and plan" },
  engineering: { label: "Engineering", hint: "MVP and architecture" },
  finance: { label: "Finance", hint: "Cost and budget" },
  marketing: { label: "Marketing", hint: "Launch narrative" },
  social_media: { label: "Social", hint: "Posts and campaigns" },
  hiring: { label: "Hiring", hint: "Roles and candidates" },
  competitor: { label: "Competitor", hint: "Landscape" },
  inbox: { label: "Inbox", hint: "Relevant mail" },
  evaluator: { label: "Evaluator", hint: "Scores the run" },
};
