import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { appOrigin } from "@/lib/config";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export const GMAIL_OAUTH_COOKIE = "rivera_gmail_oauth";

export function googleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function gmailRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return `${appOrigin()}/api/gmail/callback`;
}

function stateSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || process.env.CLERK_SECRET_KEY || "dev-gmail-oauth";
}

export function createOAuthState(organizationId: string): { state: string; nonce: string } {
  const nonce = randomBytes(16).toString("hex");
  const payload = Buffer.from(JSON.stringify({ organizationId, nonce, ts: Date.now() })).toString("base64url");
  const signature = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return { state: `${payload}.${signature}`, nonce };
}

export function parseOAuthState(state: string, nonce: string): { organizationId: string } {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) throw new Error("Invalid Gmail OAuth state");
  const expected = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new Error("Invalid Gmail OAuth state");
  }
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    organizationId?: string;
    nonce?: string;
    ts?: number;
  };
  if (!parsed.organizationId || parsed.nonce !== nonce) throw new Error("Gmail OAuth state mismatch");
  if (!parsed.ts || Date.now() - parsed.ts > 10 * 60 * 1000) throw new Error("Gmail OAuth state expired");
  return { organizationId: parsed.organizationId };
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: gmailRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: gmailRedirectUri(),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  return tokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

async function tokenRequest(body: Record<string, string>): Promise<GoogleTokens> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      ...body,
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Google token exchange failed");
  }
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in ?? 3600,
  };
}

export async function googleEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json()) as { email?: string };
  if (!response.ok || !payload.email) throw new Error("Could not read the Google account email");
  return payload.email;
}
