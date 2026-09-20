import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * AES-256-GCM envelope for at-rest secrets (Cursor API keys, GitHub tokens
 * that we don't need in the URL flow, etc.).
 *
 * The encryption key comes from `RIVERA_SECRET_KEY`. If that isn't set we
 * derive one from `CLERK_SECRET_KEY` so local dev works without extra setup,
 * but production must set `RIVERA_SECRET_KEY` explicitly — losing that value
 * will invalidate every stored secret.
 */

const ENC_PREFIX = "enc:v1:";

function encryptionKey(): Buffer {
  const raw = process.env.RIVERA_SECRET_KEY || process.env.CLERK_SECRET_KEY;
  if (!raw) {
    throw new Error(
      "RIVERA_SECRET_KEY (or CLERK_SECRET_KEY as a dev fallback) must be set to encrypt secrets.",
    );
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (plaintext.startsWith(ENC_PREFIX)) return plaintext;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  if (!value) return value;
  if (!value.startsWith(ENC_PREFIX)) return value;
  const [ivPart, tagPart, dataPart] = value.slice(ENC_PREFIX.length).split(".");
  if (!ivPart || !tagPart || !dataPart) throw new Error("Corrupt encrypted secret");
  const iv = Buffer.from(ivPart, "base64url");
  const authTag = Buffer.from(tagPart, "base64url");
  const data = Buffer.from(dataPart, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function isEncrypted(value: string | undefined): boolean {
  return Boolean(value && value.startsWith(ENC_PREFIX));
}
