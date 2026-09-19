import { appendEvent } from "@/lib/events/log";
import { errorJson, json, readJson } from "@/lib/http/json";
import { getStore } from "@/lib/store";
import { z } from "zod";

const schema = z.object({
  proposalId: z.string().min(1),
  rationale: z.string().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson("A selected proposal is required to close a decision", 400);
  const store = await getStore();
  const decision = await store.getDecision(id);
  if (!decision) return errorJson("Decision not found", 404);
  const exists = decision.proposals.some((proposal) => proposal.id === parsed.data.proposalId);
  if (!exists) return errorJson("Unknown proposal", 400);
  const next = await store.updateDecision(id, {
    selectedProposalId: parsed.data.proposalId,
    rationale: parsed.data.rationale ?? decision.rationale,
    status: "approved",
  });
  await appendEvent(store, {
    organizationId: decision.organizationId,
    runId: decision.runId,
    type: "decision.made",
    summary: "Decision approved",
    payload: { decisionId: id, proposalId: parsed.data.proposalId },
  });
  return json({ decision: next });
}
