import { nowIso } from "@/lib/clock";
import { refreshAccessToken } from "@/lib/gmail/oauth";
import type { Store } from "@/lib/store";
import type { GmailConnection } from "@/types";

export type GmailListMessage = {
  gmailId: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: string;
};

type GmailMessageList = {
  messages?: Array<{ id: string; threadId: string }>;
};

type GmailMessage = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: Array<{ name: string; value: string }> };
};

export async function accessTokenFor(store: Store, connection: GmailConnection): Promise<string> {
  if (Date.parse(connection.accessTokenExpiresAt) - 60_000 > Date.now()) {
    return connection.accessToken;
  }
  const tokens = await refreshAccessToken(connection.refreshToken);
  const next: GmailConnection = {
    ...connection,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? connection.refreshToken,
    accessTokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
  };
  await store.upsertGmailConnection(next);
  return next.accessToken;
}

export async function listRecentMessages(accessToken: string, maxResults = 40): Promise<GmailListMessage[]> {
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("maxResults", String(maxResults));
  listUrl.searchParams.set("q", "in:inbox newer_than:90d");
  const listResponse = await gmailFetch(accessToken, listUrl);
  const list = (await listResponse.json()) as GmailMessageList;
  const ids = list.messages ?? [];
  const messages: GmailListMessage[] = [];
  for (let index = 0; index < ids.length; index += 8) {
    const chunk = ids.slice(index, index + 8);
    const details = await Promise.all(chunk.map((item) => fetchMessage(accessToken, item.id)));
    messages.push(...details);
  }
  return messages;
}

async function fetchMessage(accessToken: string, id: string): Promise<GmailListMessage> {
  const detailUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
  detailUrl.searchParams.set("format", "metadata");
  detailUrl.searchParams.set("metadataHeaders", "From");
  detailUrl.searchParams.append("metadataHeaders", "Subject");
  detailUrl.searchParams.append("metadataHeaders", "Date");
  const detailResponse = await gmailFetch(accessToken, detailUrl);
  const detail = (await detailResponse.json()) as GmailMessage;
  const headers = detail.payload?.headers ?? [];
  return {
    gmailId: detail.id,
    threadId: detail.threadId,
    from: header(headers, "From") || "Unknown sender",
    subject: header(headers, "Subject") || "(no subject)",
    snippet: (detail.snippet ?? "").replace(/\s+/g, " ").trim(),
    receivedAt: detail.internalDate ? new Date(Number(detail.internalDate)).toISOString() : nowIso(),
  };
}

function header(headers: Array<{ name: string; value: string }>, name: string): string | undefined {
  return headers.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value;
}

async function gmailFetch(accessToken: string, url: URL): Promise<Response> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail API failed (${response.status}): ${body.slice(0, 240)}`);
  }
  return response;
}
