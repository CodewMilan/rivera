import { errorJson, json, statusFromError } from "@/lib/http/json";
import { createAndStartRun } from "@/lib/orchestration/run";
import { getRuntime } from "@/lib/runtime";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const runtime = await getRuntime();
    const org = await runtime.store.getOrganization(id);
    if (!org) return errorJson("Organization not found", 404);
    const run = await createAndStartRun(runtime, id);
    return json({ run }, 201);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Run failed", statusFromError(error));
  }
}
