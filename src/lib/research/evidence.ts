import type { EventRecord } from "@/types";

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
      results?: Array<{ title?: string; url?: string; snippet?: string }>;
    };
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

export function toolMetricsFromEvents(events: EventRecord[]): ToolMetric[] {
  return events
    .filter((event) => event.type === "tool.called" || event.type === "tool.failed")
    .map((event) => ({
      source: String((event.payload as { tool?: string } | undefined)?.tool ?? event.type),
      summary: event.summary,
    }));
}
