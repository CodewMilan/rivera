import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  if (!(await store.getOrganization(id))) return errorJson("Organization not found", 404);
  return json({ agents: await store.listAgents(id) });
}
