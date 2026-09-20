import { publishContent } from "@/lib/content/actions";
import { completeAfterPublish } from "@/lib/orchestration/run";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { getRuntime } from "@/lib/runtime";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const runtime = await getRuntime();
    const item = await publishContent(runtime.store, runtime.publisher, id, "now");
    const org = await runtime.store.getOrganization(item.organizationId);
    const run = org ? await runtime.store.getLatestRun(org.id) : undefined;
    if (org && run && (run.status === "review" || run.status === "approval" || run.status === "scheduled")) {
      await completeAfterPublish(runtime, org, run);
    }
    return json({ item });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Publish failed", statusFromError(error));
  }
}
