import { errorJson } from "@/lib/http/json";
import { createOAuthState, GMAIL_OAUTH_COOKIE, googleAuthUrl, googleOAuthConfigured } from "@/lib/gmail/oauth";
import { getStore } from "@/lib/store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  if (!googleOAuthConfigured()) {
    return errorJson("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to connect Gmail", 501);
  }

  const { state, nonce } = createOAuthState(id);
  const response = NextResponse.redirect(googleAuthUrl(state));
  response.cookies.set({
    name: GMAIL_OAUTH_COOKIE,
    value: nonce,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
