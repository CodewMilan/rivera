import { requireOrgAccess } from "@/lib/auth/org-guard";
import { errorJson } from "@/lib/http/json";
import {
  createGitHubOAuthState,
  GITHUB_OAUTH_COOKIE,
  githubAuthUrl,
  githubOAuthConfigured,
} from "@/lib/github/oauth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireOrgAccess(id);
  if (access instanceof Response) return access;

  if (!githubOAuthConfigured()) {
    return errorJson(
      "Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET to connect GitHub",
      501,
    );
  }
  const { state, nonce } = createGitHubOAuthState(id);
  const response = NextResponse.redirect(githubAuthUrl(state));
  response.cookies.set({
    name: GITHUB_OAUTH_COOKIE,
    value: nonce,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
