import { errorJson, json, readJson } from "@/lib/http/json";
import { requireOrgAccess } from "@/lib/auth/org-guard";
import { getStore } from "@/lib/store";
import { z } from "zod";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const organization = await store.getOrganization(id);
  if (!organization) return errorJson("Organization not found", 404);
  const events = await store.listEvents(id);
  const run = await store.getLatestRun(id);
  return json({
    organization,
    events,
    phase: run?.status ?? "intake",
  });
}

const patchSchema = z.object({
  hiringRoles: z.array(z.string().trim().min(2).max(80)).max(8),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireOrgAccess(id);
  if (access instanceof Response) return access;
  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? "Invalid update", 400);
  }
  const organization = await access.store.updateOrganization(id, {
    hiringRoles: parsed.data.hiringRoles,
  });
  return json({ organization });
}

