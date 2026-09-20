import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  await store.deleteGmailConnection(id);
  await store.deleteInboxMessages(id);
  return json({ ok: true, gmail: await store.getGmailStatus(id) });
}
