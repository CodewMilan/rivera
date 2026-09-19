import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

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
