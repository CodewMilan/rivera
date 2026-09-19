import { nowIso } from "@/lib/clock";
import { errorJson, json, readJson } from "@/lib/http/json";
import { createId } from "@/lib/ids";
import { getStore } from "@/lib/store";
import { z } from "zod";

const schema = z.object({
  organizationId: z.string().min(1),
  runId: z.string().min(1),
  title: z.string().min(2),
  pillars: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson("Invalid campaign", 400);
  const store = await getStore();
  const campaign = await store.createCampaign({
    id: createId(),
    createdAt: nowIso(),
    ...parsed.data,
  });
  return json({ campaign }, 201);
}
