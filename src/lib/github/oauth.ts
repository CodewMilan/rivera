import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { appOrigin } from "@/lib/config";

const SCOPES = ["repo", "read:user"].join(" ");

export const GITHUB_OAUTH_COOKIE = "rivera_github_oauth";

export function githubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET);
}

export function githubRedirectUri(): string {
  if (process.env.GITHUB_OAUTH_REDIRECT_URI) return process.env.GITHUB_OAUTH_REDIRECT_URI;
  return `${appOrigin()}/api/github/callback`;
}

function stateSecret(): string {
  return process.env.GITHUB_OAUTH_CLIENT_SECRET || process.env.CLERK_SECRET_KEY || "dev-github-oauth";
}

export function createGitHubOAuthState(organizationId: string): { state: string; nonce: string } {
  const nonce = randomBytes(16).toString("hex");
  const payload = Buffer.from(JSON.stringify({ organizationId, nonce, ts: Date.now() })).toString("base64url");
  const signature = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return { state: `${payload}.${signature}`, nonce };
}

export function parseGitHubOAuthState(state: string, nonce: string): { organizationId: string } {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) throw new Error("Invalid GitHub OAuth state");
  const expected = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new Error("Invalid GitHub OAuth state");
  }
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    organizationId?: string;
    nonce?: string;
    ts?: number;
  };
  if (!parsed.organizationId || parsed.nonce !== nonce) throw new Error("GitHub OAuth state mismatch");
  if (!parsed.ts || Date.now() - parsed.ts > 10 * 60 * 1000) throw new Error("GitHub OAuth state expired");
  return { organizationId: parsed.organizationId };
}

export function githubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID ?? "",
    redirect_uri: githubRedirectUri(),
    scope: SCOPES,
    state,
    allow_signup: "false",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export type GitHubTokens = {
  accessToken: string;
  scope: string;
};

export async function exchangeGitHubCode(code: string): Promise<GitHubTokens> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET ?? "",
      code,
      redirect_uri: githubRedirectUri(),
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "GitHub token exchange failed");
  }
  return { accessToken: payload.access_token, scope: payload.scope ?? "" };
}
