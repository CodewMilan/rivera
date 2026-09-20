import { errorJson, json } from "@/lib/http/json";
import { loadDemoInbox } from "@/lib/gmail/sync";
import { getRuntime } from "@/lib/runtime";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const runtime = await getRuntime();
  const org = await runtime.store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  const result = await loadDemoInbox({ store: runtime.store, org, llm: runtime.llm });
  return json({
    ok: true,
    scanned: result.scanned,
    relevant: result.relevant.length,
    demo: true,
    gmail: await runtime.store.getGmailStatus(id),
    inboxMessages: await runtime.store.listInboxMessages(id),
  });
}
