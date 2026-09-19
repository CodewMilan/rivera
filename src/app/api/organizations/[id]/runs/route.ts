import { after } from "next/server";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { createRun, runOrganization } from "@/lib/orchestration/run";
import { isTerminal } from "@/lib/orchestration/states";
import { getRuntime } from "@/lib/runtime";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const runtime = await getRuntime();
    const org = await runtime.store.getOrganization(id);
    if (!org) return errorJson("Organization not found", 404);

    const existing = await runtime.store.getLatestRun(id);
    if (existing && !existing.cancelled && !isTerminal(existing.status)) {
      return json({ run: existing });
    }

    const run = await createRun(runtime, id);
    after(() =>
      runOrganization(run.id, runtime).catch((error) => {
        console.error("Rivera run failed", error);
      }),
    );
    return json({ run }, 201);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Run failed", statusFromError(error));
  }
}
