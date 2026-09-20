import { nowIso } from "@/lib/clock";
import { demoInboxMessages } from "@/lib/gmail/demo";
import { accessTokenFor, listRecentMessages } from "@/lib/gmail/client";
import { scoreInbox } from "@/lib/gmail/relevance";
import { createId } from "@/lib/ids";
import type { LLMProvider } from "@/lib/providers/llm";
import type { Store } from "@/lib/store";
import type { GmailConnection, InboxMessage, Organization } from "@/types";

export type InboxSyncResult = {
  scanned: number;
  relevant: InboxMessage[];
  demo: boolean;
};

export async function syncGmailInbox(options: {
  store: Store;
  org: Organization;
  llm?: LLMProvider;
  demo?: boolean;
}): Promise<InboxSyncResult> {
  const connection = await options.store.getGmailConnection(options.org.id);
  if (options.demo && !connection) {
    return persistScored(options, demoInboxMessages(options.org), true);
  }
  if (!connection) {
    throw new Error("Gmail is not connected");
  }
  const token = await accessTokenFor(options.store, connection);
  const messages = await listRecentMessages(token);
  const result = await persistScored(options, messages, false);
  await options.store.upsertGmailConnection({
    ...((await options.store.getGmailConnection(options.org.id)) as GmailConnection),
    lastSyncedAt: nowIso(),
  });
  return result;
}

export async function loadDemoInbox(options: {
  store: Store;
  org: Organization;
  llm?: LLMProvider;
}): Promise<InboxSyncResult> {
  return persistScored(options, demoInboxMessages(options.org), true);
}

async function persistScored(
  options: { store: Store; org: Organization; llm?: LLMProvider },
  messages: Array<{ gmailId: string; threadId: string; from: string; subject: string; snippet: string; receivedAt: string }>,
  demo: boolean,
): Promise<InboxSyncResult> {
  const scored = await scoreInbox(options.org, messages, options.llm);
  const saved: InboxMessage[] = [];
  for (const item of scored) {
    saved.push(
      await options.store.upsertInboxMessage({
        id: createId(),
        organizationId: options.org.id,
        gmailId: item.gmailId,
        threadId: item.threadId,
        from: item.from,
        subject: item.subject,
        snippet: item.snippet,
        receivedAt: item.receivedAt,
        relevanceScore: item.relevanceScore,
        relevanceReason: item.relevanceReason,
        relevant: item.relevant,
        demo,
      }),
    );
  }
  return {
    scanned: saved.length,
    relevant: saved.filter((item) => item.relevant).sort((a, b) => b.relevanceScore - a.relevanceScore),
    demo,
  };
}
