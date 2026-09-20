import { auth } from "@clerk/nextjs/server";
import { nowIso } from "@/lib/clock";
import { appOrigin } from "@/lib/config";
import { encryptSecret } from "@/lib/crypto/secret";
import { githubViewer } from "@/lib/github/client";
import { exchangeGitHubCode, GITHUB_OAUTH_COOKIE, parseGitHubOAuthState } from "@/lib/github/oauth";
import { getStore } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
    .find((part) => part.startsWith(`${GITHUB_OAUTH_COOKIE}=`))
    ?.slice(`${GITHUB_OAUTH_COOKIE}=`.length);

  const fail = (orgId: string | undefined, message: string) => {
    const target = orgId
      ? `${origin}/organizations/${orgId}/build?github=${encodeURIComponent(message)}`
      : `${origin}/?github=${encodeURIComponent(message)}`;
    const response = NextResponse.redirect(target);
    response.cookies.delete(GITHUB_OAUTH_COOKIE);
    return response;
  };

  if (oauthError) return fail(undefined, oauthError);
  if (!code || !state || !nonce) return fail(undefined, "missing_oauth");

  let organizationId: string;
  try {
    organizationId = parseGitHubOAuthState(state, nonce).organizationId;
  } catch {
    return fail(undefined, "invalid_state");
  }

  // Verify the returning user still owns this org — the state cookie proves
  // this browser initiated the flow, but we should also confirm they're
  // signed in and authorized on the org before we write a GitHub token.
  let userId: string | null = null;
  try {
    userId = (await auth()).userId ?? null;
  } catch {
    userId = null;
  }
  if (!userId) return fail(organizationId, "not_signed_in");

  try {
    const store = await getStore();
    const org = await store.getOrganization(organizationId);
    if (!org) return fail(organizationId, "org_not_found");
    if (org.ownerUserId && org.ownerUserId !== userId) return fail(organizationId, "forbidden");

    const tokens = await exchangeGitHubCode(code);
    const viewer = await githubViewer(tokens.accessToken);
    await store.upsertGitHubConnection({
      organizationId,
      login: viewer.login,
      accessToken: encryptSecret(tokens.accessToken),
      scope: tokens.scope,
      connectedAt: nowIso(),
    });
    const response = NextResponse.redirect(`${origin}/organizations/${organizationId}/build`);
    response.cookies.delete(GITHUB_OAUTH_COOKIE);
    return response;
  } catch (error) {
    return fail(organizationId, error instanceof Error ? error.message : "github_connect_failed");
  }
}
