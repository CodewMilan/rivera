import { publishContent } from "@/lib/content/actions";
import { errorJson, json, readJson, statusFromError } from "@/lib/http/json";
import { getRuntime } from "@/lib/runtime";
import { z } from "zod";

const schema = z.object({
  scheduledAt: z.string().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = schema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return errorJson("Invalid schedule request", 400);
  try {
    const runtime = await getRuntime();
    return json({
      item: await publishContent(
        runtime.store,
        runtime.publisher,
        id,
        "schedule",
        parsed.data.scheduledAt,
      ),
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Schedule failed", statusFromError(error));
  }
}
