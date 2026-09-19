import { describe, expect, it } from "vitest";
import { dollarsToCents, parseIntake } from "./intake";

describe("phase 1 intake validation", () => {
  it("accepts a valid founder goal", () => {
    const parsed = parseIntake({
      goal: "Build a Soroban debugger for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a short goal", () => {
    const parsed = parseIntake({
      goal: "Ship it",
      deadline: "2026-10-19",
      budgetUsd: 500,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid deadline", () => {
    const parsed = parseIntake({
      goal: "Build a developer tool for Stellar",
      deadline: "not-a-date",
      budgetUsd: 500,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-positive budget", () => {
    const parsed = parseIntake({
      goal: "Build a developer tool for Stellar",
      deadline: "2026-10-19",
      budgetUsd: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("converts dollars to cents", () => {
    expect(dollarsToCents(500)).toBe(50000);
  });
});
