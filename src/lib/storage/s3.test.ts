import { afterEach, describe, expect, it } from "vitest";
import { s3MediaConfig } from "@/lib/config";
import {
  isPersistableMediaUrl,
  mediaObjectKey,
  persistRemoteMedia,
  publicObjectUrl,
  setMediaPersister,
} from "./s3";

const keys = ["S3_BUCKET", "S3_PUBLIC_BASE_URL", "AWS_REGION", "AWS_DEFAULT_REGION"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  setMediaPersister(null);
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("s3 media persist", () => {
  it("skips local and relative fixture URLs", () => {
    expect(isPersistableMediaUrl("/figma/demo.png")).toBe(false);
    expect(isPersistableMediaUrl("http://localhost:3000/out.mp4")).toBe(false);
    expect(isPersistableMediaUrl("https://files.higgsfield.test/out.jpg")).toBe(true);
  });

  it("builds public URLs from the bucket or a CDN base", () => {
    process.env.S3_BUCKET = "rivera-assets";
    process.env.AWS_REGION = "us-east-1";
    delete process.env.S3_PUBLIC_BASE_URL;
    const config = s3MediaConfig()!;
    expect(publicObjectUrl("orgs/o1/media/a1.png", config)).toBe(
      "https://rivera-assets.s3.us-east-1.amazonaws.com/orgs/o1/media/a1.png",
    );
    process.env.S3_PUBLIC_BASE_URL = "https://cdn.rivera.test/";
    expect(publicObjectUrl("orgs/o1/media/a1.png", s3MediaConfig()!)).toBe(
      "https://cdn.rivera.test/orgs/o1/media/a1.png",
    );
  });

  it("uses the source extension in the object key", () => {
    expect(
      mediaObjectKey({
        organizationId: "org-1",
        assetId: "asset-1",
        sourceUrl: "https://files.higgsfield.test/clip.webm",
        kind: "video",
      }),
    ).toBe("orgs/org-1/media/asset-1.webm");
  });

  it("returns the source URL when S3 is not configured", async () => {
    delete process.env.S3_BUCKET;
    const url = await persistRemoteMedia({
      organizationId: "org-1",
      assetId: "asset-1",
      sourceUrl: "https://files.higgsfield.test/out.jpg",
      kind: "image",
    });
    expect(url).toBe("https://files.higgsfield.test/out.jpg");
  });

  it("uploads remote bytes and returns the public object URL", async () => {
    process.env.S3_BUCKET = "rivera-assets";
    process.env.AWS_REGION = "us-east-1";
    const puts: Array<{ key: string; contentType: string; bytes: number }> = [];
    const url = await persistRemoteMedia(
      {
        organizationId: "org-1",
        assetId: "asset-1",
        sourceUrl: "https://files.higgsfield.test/out.jpg",
        kind: "image",
      },
      {
        download: async () => ({
          body: new Uint8Array([1, 2, 3]),
          contentType: "image/jpeg",
        }),
        put: async ({ key, contentType, body }) => {
          puts.push({ key, contentType, bytes: body.byteLength });
        },
      },
    );
    expect(puts).toEqual([{ key: "orgs/org-1/media/asset-1.jpg", contentType: "image/jpeg", bytes: 3 }]);
    expect(url).toBe("https://rivera-assets.s3.us-east-1.amazonaws.com/orgs/org-1/media/asset-1.jpg");
  });
});
