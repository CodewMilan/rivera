import { z } from "zod";
import { errorJson, json, readJson, statusFromError } from "@/lib/http/json";
import { createStandaloneMediaJob } from "@/lib/media/jobs";
import { getRuntime } from "@/lib/runtime";

const schema = z.object({
  prompt: z.string().min(3),
  type: z.enum(["image", "video"]).default("image"),
  costCeilingCents: z.number().int().positive().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? "Invalid media request", 400);
  try {
    const runtime = await getRuntime();
    if (!(await runtime.store.getOrganization(id))) return errorJson("Organization not found", 404);
    const job = await createStandaloneMediaJob(runtime.store, runtime.media, {
      organizationId: id,
      ...parsed.data,
    });
    return json({ job }, 201);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Media job failed", statusFromError(error));
  }
}
