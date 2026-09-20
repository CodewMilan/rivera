import { describe, expect, it } from "vitest";
import { demoSpecialistOutput } from "@/lib/demo/fixtures";
import { agentOutputSchema, parseJsonFromModel } from "./schema";

const types = [
  "research",
  "strategy",
  "engineering",
  "finance",
  "marketing",
  "social_media",
  "hiring",
  "competitor",
  "evaluator",
] as const;

describe("phase 3 agent contracts", () => {
  it("accepts structured output from every specialist", () => {
    for (const type of types) {
      const parsed = agentOutputSchema.parse({
        ...demoSpecialistOutput(type, "Build a Soroban debugger"),
        agentType: type,
        taskId: "task-1",
      });
      expect(parsed.summary.length).toBeGreaterThan(10);
      expect(parsed.confidence).toBeGreaterThan(0);
    }
  });

  it("extracts JSON from fenced model text", () => {
    const value = parseJsonFromModel('Sure.\n```json\n{"status":"success","summary":"ok","findings":[],"evidence":[],"risks":[],"confidence":0.5,"artifacts":[],"estimatedCostCents":1}\n```');
    expect(agentOutputSchema.parse(value).status).toBe("success");
  });
});
