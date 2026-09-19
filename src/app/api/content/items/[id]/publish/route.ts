import { publishContent } from "@/lib/content/actions";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { getRuntime } from "@/lib/runtime";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const runtime = await getRuntime();
    return json({ item: await publishContent(runtime.store, runtime.publisher, id, "now") });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Publish failed", statusFromError(error));
  }
}
