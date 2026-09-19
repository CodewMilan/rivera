import { appendEvent } from "@/lib/events/log";
import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const decision = await store.getDecision(id);
  if (!decision) return errorJson("Decision not found", 404);
  const next = await store.updateDecision(id, { status: "rejected" });
  await appendEvent(store, {
    organizationId: decision.organizationId,
    runId: decision.runId,
    type: "decision.rejected",
    summary: "Decision rejected",
    payload: { decisionId: id },
  });
  return json({ decision: next });
}
