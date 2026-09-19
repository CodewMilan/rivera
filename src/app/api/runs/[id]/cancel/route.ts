import { nowIso } from "@/lib/clock";
import { appendEvent } from "@/lib/events/log";
import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const run = await store.getRun(id);
  if (!run) return errorJson("Run not found", 404);
  const next = await store.updateRun(id, { cancelled: true, status: "cancelled", updatedAt: nowIso() });
  await appendEvent(store, {
    organizationId: run.organizationId,
    runId: run.id,
    type: "run.cancelled",
    summary: "Run cancelled",
  });
  return json({ run: next });
}
