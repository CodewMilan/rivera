import { errorJson } from "@/lib/http/json";
import {
  createGitHubOAuthState,
  GITHUB_OAUTH_COOKIE,
  githubAuthUrl,
  githubOAuthConfigured,
} from "@/lib/github/oauth";
import { getStore } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
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
