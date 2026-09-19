import { describe, expect, it } from "vitest";
import { evidenceFromEvents, toolMetricsFromEvents } from "./evidence";

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
