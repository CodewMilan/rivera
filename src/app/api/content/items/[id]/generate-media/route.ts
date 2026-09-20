import { createStandaloneMediaJob } from "@/lib/media/jobs";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { getRuntime } from "@/lib/runtime";

export const maxDuration = 120;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const runtime = await getRuntime();
    const item = await runtime.store.getContentItem(id);
    if (!item) return errorJson("Content item not found", 404);
    const job = await createStandaloneMediaJob(runtime.store, runtime.media, {
      organizationId: item.organizationId,
      prompt: item.hook,
      type: item.type === "video" ? "video" : "image",
      contentItemId: item.id,
    });
    return json({ job, item: await runtime.store.getContentItem(id) }, 201);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Media generation failed", statusFromError(error));
  }
}
