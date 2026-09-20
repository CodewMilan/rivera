import { phaseLabel } from "@/lib/format";
import { isTerminal } from "@/lib/orchestration/states";
import type { Store } from "@/lib/store";
import type { Agent, Organization, Run, Task } from "@/types";

export type HomeAgentRow = {
  id: string;
  name: string;
  status: string;
  when: string;
  detail: string;
};

export type HomeRunRow = {
  id: string;
  href: string;
  organizationId: string;
  title: string;
  extra: string;
  status: string;
  when: string;
  detail: string;
};

export type HomeOverview = {
  signedIn: boolean;
  organizations: Array<{ id: string; name: string; slug: string }>;
  selected?: {
    id: string;
    name: string;
    slug: string;
    goal: string;
    phase: string;
    metrics: {
      tasksThisWeek: number;
      taskSuccessRate: string;
      avgRunTime: string;
    };
    agents: HomeAgentRow[];
    runs: HomeRunRow[];
    agentNames: string[];
  };
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function orgSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "org";
}

export function relativeTime(iso?: string, now = Date.now()): string {
  if (!iso) return "";
  const delta = Math.max(0, now - Date.parse(iso));
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function pickOrganizationsForUser(orgs: Organization[], userId?: string): Organization[] {
  const sorted = [...orgs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!userId) return sorted;
  const mine = sorted.filter((org) => org.ownerUserId === userId);
  return mine.length ? mine : sorted;
}

function agentStatusLabel(status: Agent["status"]): string {
  if (status === "working") return "Running";
  if (status === "failed") return "Failed";
  if (status === "blocked" || status === "review") return "Needs review";
  return "Successful";
}

function runStatusLabel(status: Run["status"]): string {
  if (status === "failed" || status === "cancelled") return "Failed";
  if (isTerminal(status)) return "Successful";
  return phaseLabel(status);
}

function tasksThisWeek(tasks: Task[], now: number): Task[] {
  return tasks.filter((task) => now - Date.parse(task.createdAt) <= WEEK_MS);
}

function successRate(tasks: Task[]): string {
  const finished = tasks.filter((task) => task.status === "done" || task.status === "failed");
  if (finished.length === 0) return "—";
  const done = finished.filter((task) => task.status === "done").length;
  return `${Math.round((done / finished.length) * 100)}%`;
}

function averageRunTime(runs: Run[]): string {
  const durations = runs
    .map((run) => Date.parse(run.updatedAt) - Date.parse(run.startedAt))
    .filter((ms) => Number.isFinite(ms) && ms > 0);
  if (durations.length === 0) return "—";
  return formatDuration(durations.reduce((sum, ms) => sum + ms, 0) / durations.length);
}

export async function buildHomeOverview(
  store: Store,
  options: { userId?: string; selectedId?: string; now?: number } = {},
): Promise<HomeOverview> {
  const now = options.now ?? Date.now();
  const orgs = pickOrganizationsForUser(await store.listOrganizations(), options.userId);
  const overview: HomeOverview = {
    signedIn: Boolean(options.userId),
    organizations: orgs.map((org) => ({ id: org.id, name: org.name, slug: orgSlug(org.name) })),
  };
  if (orgs.length === 0) return overview;

  const selected = orgs.find((org) => org.id === options.selectedId) ?? orgs[0];
  const [agents, tasks, runs] = await Promise.all([
    store.listAgents(selected.id),
    store.listTasks(selected.id),
    store.listRuns(selected.id),
  ]);
  const weekTasks = tasksThisWeek(tasks, now);
  const latest = runs[0];

  overview.selected = {
    id: selected.id,
    name: selected.name,
    slug: orgSlug(selected.name),
    goal: selected.goal,
    phase: phaseLabel(latest?.status),
    metrics: {
      tasksThisWeek: weekTasks.length,
      taskSuccessRate: successRate(weekTasks.length ? weekTasks : tasks),
      avgRunTime: averageRunTime(runs),
    },
    agents: agents.slice(0, 4).map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: agentStatusLabel(agent.status),
      when: relativeTime(latest?.updatedAt, now),
      detail: agent.lastAction?.slice(0, 48) || agent.type,
    })),
    runs: runs.slice(0, 4).map((run) => ({
      id: run.id,
      href: `/organizations/${selected.id}`,
      organizationId: selected.id,
      title: `${phaseLabel(run.status)} / ${selected.domain || "launch"}`,
      extra: selected.domain || "main",
      status: runStatusLabel(run.status),
      when: relativeTime(run.updatedAt, now),
      detail: run.id.slice(0, 8),
    })),
    agentNames: agents.map((agent) => agent.type),
  };

  return overview;
}
