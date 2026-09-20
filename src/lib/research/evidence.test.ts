import { describe, expect, it } from "vitest";
import { evidenceFromEvents, hiringCandidatesFromEvents, toolMetricsFromEvents } from "./evidence";

describe("phase 3 evidence", () => {
  it("dedupes search and GitHub URLs from tool events", () => {
    const links = evidenceFromEvents([
      {
        id: "1",
        organizationId: "org",
        type: "tool.called",
        summary: "webSearch returned 1 sources",
        payload: {
          tool: "webSearch",
          results: [{ title: "Pain", url: "https://example.com/a", snippet: "opaque XDR" }],
        },
        createdAt: "2026-09-19T00:00:00.000Z",
      },
      {
        id: "2",
        organizationId: "org",
        type: "tool.called",
        summary: "github search returned 1 issues",
        payload: {
          tool: "github",
          results: [{ title: "Pain", url: "https://example.com/a" }],
        },
        createdAt: "2026-09-19T00:00:01.000Z",
      },
    ]);
    expect(links).toHaveLength(2);
    expect(links.map((item) => item.source)).toEqual(["webSearch", "github"]);
  });

  it("keeps LinkedIn shortlist hits out of research evidence", () => {
    const event = {
      id: "3",
      organizationId: "org",
      type: "tool.called" as const,
      summary: "hiring search returned 1 candidates for Founding Engineer",
      payload: {
        tool: "webSearch",
        role: "Founding Engineer",
        query: 'site:linkedin.com/in "Founding Engineer"',
        results: [{ title: "Amina Okonkwo", url: "https://www.linkedin.com/in/amina-okonkwo-demo" }],
      },
      createdAt: "2026-09-19T00:00:02.000Z",
    };
    expect(evidenceFromEvents([event])).toEqual([]);
    expect(hiringCandidatesFromEvents([event])).toEqual([
      {
        role: "Founding Engineer",
        title: "Amina Okonkwo",
        url: "https://www.linkedin.com/in/amina-okonkwo-demo",
        snippet: undefined,
      },
    ]);
  });

  it("keeps calculator metrics even without URLs", () => {
    const metrics = toolMetricsFromEvents([
      {
        id: "1",
        organizationId: "org",
        type: "tool.called",
        summary: "calculator returned 80",
        payload: { tool: "calculator", result: 80 },
        createdAt: "2026-09-19T00:00:00.000Z",
      },
    ]);
    expect(metrics[0]?.summary).toMatch(/80/);
  });
});
