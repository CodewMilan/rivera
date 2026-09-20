import { regenerateContentMedia } from "@/lib/content/actions";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { getRuntime } from "@/lib/runtime";

export const maxDuration = 120;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const runtime = await getRuntime();
    return json({ item: await regenerateContentMedia(runtime.store, runtime.media, id) });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Regenerate failed", statusFromError(error));
  }
}
