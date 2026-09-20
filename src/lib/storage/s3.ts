import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { s3MediaConfig, type S3MediaConfig } from "@/lib/config";

const MAX_BYTES = 50 * 1024 * 1024;

export type PersistMediaInput = {
  organizationId: string;
  assetId: string;
  sourceUrl: string;
  kind: "image" | "video";
};

export type PersistMediaUrl = (input: PersistMediaInput) => Promise<string>;

export type DownloadedMedia = {
  body: Uint8Array;
  contentType?: string;
};

export type MediaDownloader = (url: string) => Promise<DownloadedMedia>;

export type MediaPutter = (input: {
  key: string;
  body: Uint8Array;
  contentType: string;
  bucket: string;
  region: string;
}) => Promise<void>;

let persister: PersistMediaUrl | null = null;
let client: S3Client | undefined;
let clientRegion: string | undefined;

export function setMediaPersister(next: PersistMediaUrl | null) {
  persister = next;
}

export function isPersistableMediaUrl(url: string): boolean {
  if (!url || url.startsWith("/")) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return false;
    return true;
  } catch {
    return false;
  }
}

export function publicObjectUrl(key: string, config: S3MediaConfig): string {
  if (config.publicBaseUrl) return `${config.publicBaseUrl}/${key}`;
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

export function mediaObjectKey(input: {
  organizationId: string;
  assetId: string;
  sourceUrl: string;
  contentType?: string;
  kind: "image" | "video";
}): string {
  return `orgs/${input.organizationId}/media/${input.assetId}${extensionFor(input)}`;
}

export async function persistMediaUrl(input: PersistMediaInput): Promise<string> {
  if (persister) return persister(input);
  return persistRemoteMedia(input);
}

export async function persistRemoteMedia(
  input: PersistMediaInput,
  deps: { download?: MediaDownloader; put?: MediaPutter } = {},
): Promise<string> {
  const config = s3MediaConfig();
  if (!config || !isPersistableMediaUrl(input.sourceUrl)) return input.sourceUrl;

  const file = await (deps.download ?? defaultDownload)(input.sourceUrl);
  const contentType = file.contentType?.split(";")[0]?.trim() || fallbackContentType(input.kind);
  const key = mediaObjectKey({ ...input, contentType: file.contentType });
  await (deps.put ?? defaultPut)({
    key,
    body: file.body,
    contentType,
    bucket: config.bucket,
    region: config.region,
  });
  return publicObjectUrl(key, config);
}

async function defaultDownload(url: string): Promise<DownloadedMedia> {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Media download failed (${response.status})`);
  const contentType = response.headers.get("content-type") ?? undefined;
  const body = new Uint8Array(await response.arrayBuffer());
  if (body.byteLength === 0) throw new Error("Media download was empty");
  if (body.byteLength > MAX_BYTES) throw new Error("Media file exceeds the 50MB persist limit");
  return { body, contentType };
}

async function defaultPut(input: Parameters<MediaPutter>[0]): Promise<void> {
  if (!client || clientRegion !== input.region) {
    client = new S3Client({ region: input.region });
    clientRegion = input.region;
  }
  await client.send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

function extensionFor(input: {
  sourceUrl: string;
  contentType?: string;
  kind: "image" | "video";
}): string {
  try {
    const pathname = new URL(input.sourceUrl).pathname;
    const match = pathname.match(/\.(mp4|webm|mov|png|jpe?g|gif|webp|avif)$/i);
    if (match) return match[0].toLowerCase() === ".jpeg" ? ".jpg" : match[0].toLowerCase();
  } catch {
    // Fall through to content-type / kind.
  }
  const type = input.contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("webm")) return ".webm";
  if (type.includes("png")) return ".png";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  return input.kind === "video" ? ".mp4" : ".png";
}

function fallbackContentType(kind: "image" | "video"): string {
  return kind === "video" ? "video/mp4" : "image/png";
}
