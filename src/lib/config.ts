export function appOrigin(): string {
  const explicit = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function higgsfieldWebhookUrl(): string | undefined {
  if (process.env.HIGGSFIELD_WEBHOOK_URL) return process.env.HIGGSFIELD_WEBHOOK_URL;
  const origin = appOrigin();
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return undefined;
  return `${origin}/api/webhooks/higgsfield`;
}

export function isDeployedProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}
