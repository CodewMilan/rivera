import { errorJson, json, statusFromError } from "@/lib/http/json";
import { syncGmailInbox } from "@/lib/gmail/sync";
import { getRuntime } from "@/lib/runtime";

export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const runtime = await getRuntime();
    const org = await runtime.store.getOrganization(id);
    if (!org) return errorJson("Organization not found", 404);
    const result = await syncGmailInbox({ store: runtime.store, org, llm: runtime.llm });
    return json({
      ok: true,
      scanned: result.scanned,
      relevant: result.relevant.length,
      gmail: await runtime.store.getGmailStatus(id),
      inboxMessages: await runtime.store.listInboxMessages(id),
    });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Gmail scan failed", statusFromError(error));
  }
}
