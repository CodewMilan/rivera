import { errorJson, json, readJson } from "@/lib/http/json";
import { createId } from "@/lib/ids";
import { getStore } from "@/lib/store";
import { z } from "zod";

const schema = z.object({
  campaignId: z.string(),
  organizationId: z.string(),
  platform: z.enum(["x", "linkedin", "instagram", "tiktok"]),
  type: z.enum(["text", "video", "carousel", "image"]),
  title: z.string().min(1),
  hook: z.string().min(1),
  caption: z.string().min(1),
  script: z.string().optional(),
  callToAction: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  claimsUsed: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson("Invalid content item", 400);
  const store = await getStore();
  const item = await store.createContentItem({
    id: createId(),
    mediaAssetIds: [],
    status: "draft",
    ...parsed.data,
  });
  return json({ item }, 201);
}
