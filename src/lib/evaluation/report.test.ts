import { describe, expect, it } from "vitest";
import { evaluateAgentOutput, rejectIfOverBudget } from "./report";

describe("phase 3 evaluator", () => {
  it("flags findings without evidence", () => {
    const result = evaluateAgentOutput({
      status: "success",
      summary: "Lots of strong claims about the market.",
      findings: ["a", "b", "c"],
      evidence: [],
      risks: [],
      confidence: 0.4,
      artifacts: [],
      estimatedCostCents: 0,
    });
    expect(result.retryRecommended).toBe(true);
  });

  it("rejects over-budget claims", () => {
    expect(rejectIfOverBudget(8000, 2000).accepted).toBe(false);
    expect(rejectIfOverBudget(800, 2000).accepted).toBe(true);
  });
});
