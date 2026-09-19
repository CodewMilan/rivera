import { z } from "zod";

export const agentOutputSchema = z.object({
  agentType: z
    .enum([
      "ceo",
      "research",
      "strategy",
      "engineering",
      "finance",
      "marketing",
      "social_media",
      "evaluator",
    ])
    .optional(),
  taskId: z.string().optional(),
  status: z.enum(["success", "needs_review", "blocked", "failed"]),
  summary: z.string().min(1),
  findings: z.array(z.unknown()),
  evidence: z.array(z.unknown()),
  risks: z.array(z.unknown()),
  recommendation: z.string().optional(),
  confidence: z.number().min(0).max(1),
  artifacts: z.array(z.string()),
  nextAction: z.string().optional(),
  estimatedCostCents: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative().optional(),
});

export const ceoPlanSchema = z.object({
  organizationName: z.string().min(1),
  domain: z.string().min(1),
  summary: z.string().min(1),
  recommendation: z.string().min(1),
  confidence: z.number().min(0).max(1),
  agents: z
    .array(
      z.object({
        type: z.enum([
          "research",
          "strategy",
          "engineering",
          "finance",
          "marketing",
          "social_media",
          "evaluator",
        ]),
        objective: z.string().min(1),
        tools: z.array(z.string()),
      }),
    )
    .min(1),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        agentType: z.enum([
          "research",
          "strategy",
          "engineering",
          "finance",
          "marketing",
          "social_media",
          "evaluator",
        ]),
        dependsOnTitles: z.array(z.string()).optional(),
        estimatedCostCents: z.number().int().nonnegative().optional(),
      }),
    )
    .min(1),
});

export function parseJsonFromModel(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model response did not contain JSON");
  }
  return JSON.parse(raw.slice(start, end + 1));
}
