import type { AgentOutput, FinalReport, Organization, Run } from "@/types";

export function evaluateAgentOutput(output: AgentOutput): {
  score: number;
  complete: boolean;
  retryRecommended: boolean;
  notes: string;
} {
  const hasEvidence = output.evidence.length > 0;
  const hasSummary = output.summary.trim().length > 10;
  const unsupported = output.evidence.length === 0 && output.findings.length > 2;
  const score = Math.round(
    (hasSummary ? 30 : 10) +
      (hasEvidence ? 30 : 10) +
      output.confidence * 30 +
      (output.status === "success" ? 10 : 0),
  );
  return {
    score: Math.min(100, score),
    complete: output.status === "success" && hasSummary,
    retryRecommended: output.status === "failed" || unsupported,
    notes: unsupported ? "Findings lack evidence" : output.summary,
  };
}

export function rejectIfOverBudget(
  estimatedCostCents: number,
  remainingCents: number,
): { accepted: boolean; reason?: string } {
  if (estimatedCostCents > remainingCents) {
    return { accepted: false, reason: "Claimed spend exceeds remaining budget" };
  }
  return { accepted: true };
}

export function assembleReport(input: {
  organization: Organization;
  run: Run;
  evaluator?: AgentOutput;
  artifacts: string[];
  risks: string[];
}): FinalReport {
  const metrics = new Map<string, number>();
  for (const finding of input.evaluator?.findings ?? []) {
    if (finding && typeof finding === "object" && "metric" in finding && "value" in finding) {
      const row = finding as { metric: string; value: number };
      metrics.set(row.metric, row.value);
    }
  }
  return {
    organizationId: input.organization.id,
    runId: input.run.id,
    opportunityScore: metrics.get("opportunityScore") ?? 72,
    problemStrength: metrics.get("problemStrength") ?? 75,
    evidenceQuality: metrics.get("evidenceQuality") ?? 60,
    technicalFeasibility: metrics.get("technicalFeasibility") ?? 78,
    budgetFit: metrics.get("budgetFit") ?? (input.organization.budgetUsedCents < input.organization.budgetCents ? 84 : 40),
    distributionPotential: metrics.get("distributionPotential") ?? 68,
    mainRisks: input.risks.slice(0, 5),
    recommendedNextSteps: [
      "Talk to five target developers this week",
      "Keep the MVP local-first",
      "Publish one approved post, not a spray of drafts",
    ],
    artifacts: input.artifacts,
  };
}
