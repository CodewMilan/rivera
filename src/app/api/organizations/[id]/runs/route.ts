import { nowIso } from "@/lib/clock";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { createRun, runOrganization } from "@/lib/orchestration/run";
import { isTerminal } from "@/lib/orchestration/states";
import { getRuntime } from "@/lib/runtime";

export const maxDuration = 60;

const WAITING_ON_HUMAN = new Set(["review", "approval", "scheduled", "published", "evaluation"]);

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const runtime = await getRuntime();
    const org = await runtime.store.getOrganization(id);
    if (!org) return errorJson("Organization not found", 404);

    const existing = await runtime.store.getLatestRun(id);
    if (existing && !existing.cancelled && !isTerminal(existing.status)) {
      if (WAITING_ON_HUMAN.has(existing.status)) {
        return json({ run: existing });
      }
      await runtime.store.updateRun(existing.id, { startedAt: nowIso(), updatedAt: nowIso() });
      const run = await runOrganization(existing.id, runtime);
      return json({ run });
    }

    const created = await createRun(runtime, id);
    const run = await runOrganization(created.id, runtime);
    return json({ run }, 201);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Run failed", statusFromError(error));
  }
}
