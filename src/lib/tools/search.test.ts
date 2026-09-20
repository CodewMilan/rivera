import { describe, expect, it } from "vitest";
import { calculate } from "./calculator";
import { FakeSearchProvider, recordedSearchFixtures } from "./search";
import { searchGithubIssues } from "./github";

describe("phase 3 tools", () => {
  it("returns recorded LinkedIn fixtures for hiring queries", async () => {
    const results = await new FakeSearchProvider().search('site:linkedin.com/in "Founding Engineer" Soroban');
    expect(results).toEqual(recordedSearchFixtures.linkedin);
    expect(results[0]?.url).toContain("linkedin.com/in/");
  });

  it("returns a recorded GitHub issue in tests", async () => {
    const results = await searchGithubIssues("soroban");
    expect(results[0]?.title).toMatch(/Soroban/i);
  });

  it("evaluates numeric expressions only", () => {
    expect(calculate("40 + 40")).toBe(80);
    expect(() => calculate("process.exit(1)")).toThrow(/numeric/);
  });
});
