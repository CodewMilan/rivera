import { errorJson, json, readJson } from "@/lib/http/json";
import { getStore } from "@/lib/store";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).optional(),
  hook: z.string().min(1).optional(),
  caption: z.string().min(1).optional(),
  script: z.string().optional(),
  callToAction: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  claimsUsed: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson("Invalid content update", 400);
  const store = await getStore();
  const item = await store.getContentItem(id);
  if (!item) return errorJson("Content item not found", 404);
  return json({ item: await store.updateContentItem(id, parsed.data) });
}
