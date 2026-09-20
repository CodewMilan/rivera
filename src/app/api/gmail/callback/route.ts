import { nowIso } from "@/lib/clock";
import { appOrigin } from "@/lib/config";
import { exchangeCode, googleEmail, GMAIL_OAUTH_COOKIE, parseOAuthState } from "@/lib/gmail/oauth";
import { syncGmailInbox } from "@/lib/gmail/sync";
import { createLLMProvider } from "@/lib/providers/llm";
import { getStore } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin();
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const nonce = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GMAIL_OAUTH_COOKIE}=`))
    ?.slice(`${GMAIL_OAUTH_COOKIE}=`.length);

  const fail = (orgId: string | undefined, message: string) => {
    const target = orgId ? `${origin}/organizations/${orgId}?gmail=${encodeURIComponent(message)}` : `${origin}/?gmail=${encodeURIComponent(message)}`;
    const response = NextResponse.redirect(target);
    response.cookies.delete(GMAIL_OAUTH_COOKIE);
    return response;
  };

  if (oauthError) return fail(undefined, oauthError);
  if (!code || !state || !nonce) return fail(undefined, "missing_oauth");

  let organizationId: string;
  try {
    organizationId = parseOAuthState(state, nonce).organizationId;
  } catch {
    return fail(undefined, "invalid_state");
  }

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refreshToken) return fail(organizationId, "missing_refresh_token");
    const email = await googleEmail(tokens.accessToken);
    const store = await getStore();
    const org = await store.getOrganization(organizationId);
    if (!org) return fail(organizationId, "org_not_found");
    await store.upsertGmailConnection({
      organizationId,
      email,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      connectedAt: nowIso(),
    });
    try {
      await syncGmailInbox({ store, org, llm: createLLMProvider() });
    } catch {
      // Connection succeeded; the founder can scan from the dashboard.
    }
    const response = NextResponse.redirect(`${origin}/organizations/${organizationId}`);
    response.cookies.delete(GMAIL_OAUTH_COOKIE);
    return response;
  } catch (error) {
    return fail(organizationId, error instanceof Error ? error.message : "gmail_connect_failed");
  }
}
