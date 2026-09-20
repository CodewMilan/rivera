import type { EventRecord, Task } from "@/types";

export type EvidenceLink = {
  title: string;
  url: string;
  snippet?: string;
  source: string;
};

export type ToolMetric = {
  source: string;
  summary: string;
};

export function evidenceFromEvents(events: EventRecord[]): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  const seen = new Set<string>();
  for (const event of events) {
    if (event.type !== "tool.called") continue;
    const payload = event.payload as {
      tool?: string;
      role?: string;
      query?: string;
      results?: Array<{ title?: string; url?: string; snippet?: string }>;
    };
    if (isHiringSearch(payload)) continue;
    for (const result of payload.results ?? []) {
      if (!result.url || seen.has(`${payload.tool ?? "tool"}:${result.url}`)) continue;
      seen.add(`${payload.tool ?? "tool"}:${result.url}`);
      links.push({
        title: result.title ?? result.url,
        url: result.url,
        snippet: result.snippet,
        source: payload.tool ?? "tool",
      });
    }
  }
  return links;
}

export type HiringCandidate = {
  role: string;
  title: string;
  url: string;
  snippet?: string;
};

function isHiringSearch(payload: { role?: string; query?: string }) {
  return Boolean(payload.role) || (typeof payload.query === "string" && payload.query.includes("linkedin.com"));
}

export function hiringCandidatesFromEvents(events: EventRecord[]): HiringCandidate[] {
  const candidates: HiringCandidate[] = [];
  const seen = new Set<string>();
  for (const event of events) {
    if (event.type !== "tool.called") continue;
    const payload = event.payload as {
      tool?: string;
      role?: string;
      query?: string;
      results?: Array<{ title?: string; url?: string; snippet?: string }>;
    };
    if (payload.tool !== "webSearch" || !isHiringSearch(payload)) continue;
    const role = payload.role ?? "Role";
    for (const result of payload.results ?? []) {
      if (!result.url || seen.has(result.url)) continue;
      seen.add(result.url);
      candidates.push({
        role,
        title: result.title ?? result.url,
        url: result.url,
        snippet: result.snippet,
      });
    }
  }
  return candidates;
}

export function hiringCandidatesFromTask(task: Task | undefined): HiringCandidate[] {
  if (!task?.output || typeof task.output !== "object") return [];
  const findings = (task.output as { findings?: unknown[] }).findings ?? [];
  const candidates: HiringCandidate[] = [];
  const seen = new Set<string>();
  for (const finding of findings) {
    if (!finding || typeof finding !== "object") continue;
    const item = finding as {
      role?: string;
      results?: Array<{ title?: string; url?: string; snippet?: string }>;
    };
    if (!item.role || !Array.isArray(item.results)) continue;
    for (const result of item.results) {
      if (!result.url || seen.has(result.url)) continue;
      seen.add(result.url);
      candidates.push({
        role: item.role,
        title: result.title ?? result.url,
        url: result.url,
        snippet: result.snippet,
      });
    }
  }
  return candidates;
}

export function mergeHiringCandidates(...lists: HiringCandidate[][]): HiringCandidate[] {
  const seen = new Set<string>();
  const merged: HiringCandidate[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }
  }
  return merged;
}

export function toolMetricsFromEvents(events: EventRecord[]): ToolMetric[] {
  return events
    .filter((event) => event.type === "tool.called" || event.type === "tool.failed")
    .map((event) => ({
      source: String((event.payload as { tool?: string } | undefined)?.tool ?? event.type),
      summary: event.summary,
    }));
}
