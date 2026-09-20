import { afterEach, describe, expect, it } from "vitest";
import { appOrigin, higgsfieldWebhookUrl } from "./config";

const keys = [
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "HIGGSFIELD_WEBHOOK_URL",
] as const;

const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("deploy config", () => {
  it("prefers APP_URL over Vercel hostnames", () => {
    process.env.APP_URL = "https://rivera.example/";
    process.env.VERCEL_URL = "rivera-git-main-user.vercel.app";
    expect(appOrigin()).toBe("https://rivera.example");
  });

  it("derives the Higgsfield webhook on a public host", () => {
    delete process.env.HIGGSFIELD_WEBHOOK_URL;
    process.env.APP_URL = "https://rivera.example";
    expect(higgsfieldWebhookUrl()).toBe("https://rivera.example/api/webhooks/higgsfield");
  });

  it("does not invent a localhost webhook", () => {
    delete process.env.HIGGSFIELD_WEBHOOK_URL;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(higgsfieldWebhookUrl()).toBeUndefined();
  });
});
