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

export type S3MediaConfig = {
  bucket: string;
  region: string;
  publicBaseUrl?: string;
};

export function s3MediaConfig(): S3MediaConfig | undefined {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) return undefined;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/$/, "") || undefined;
  return {
    bucket,
    region: (process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1").trim(),
    publicBaseUrl,
  };
}
