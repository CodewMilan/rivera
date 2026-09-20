import { createHmac, randomBytes } from "node:crypto";

export type SocialDraftInput = {
  platform: "x" | "linkedin" | "instagram" | "tiktok";
  text: string;
  mediaUrls: string[];
};

export type SocialDraft = {
  id: string;
  platform: SocialDraftInput["platform"];
  text: string;
  demo: boolean;
};

export type SocialPublishInput = SocialDraftInput & {
  approvalId: string;
};

export type PublishedPost = {
  id: string;
  platform: SocialDraftInput["platform"];
  url?: string;
  demo: boolean;
};

export interface SocialPublisher {
  createDraft(input: SocialDraftInput): Promise<SocialDraft>;
  schedule(input: SocialPublishInput & { scheduledAt: string }): Promise<PublishedPost>;
  publish(input: SocialPublishInput): Promise<PublishedPost>;
}

export type XUserCredentials = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

export class DemoSocialPublisher implements SocialPublisher {
  async createDraft(input: SocialDraftInput): Promise<SocialDraft> {
    return { id: `draft_${input.platform}`, platform: input.platform, text: input.text, demo: true };
  }

  async schedule(input: SocialPublishInput & { scheduledAt: string }): Promise<PublishedPost> {
    return {
      id: `demo_sched_${input.platform}`,
      platform: input.platform,
      demo: true,
    };
  }

  async publish(input: SocialPublishInput): Promise<PublishedPost> {
    return {
      id: `demo_pub_${input.platform}`,
      platform: input.platform,
      url: `https://x.com/rivera_demo/status/demo`,
      demo: true,
    };
  }
}

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function xOAuthAuthorizationHeader(
  credentials: XUserCredentials,
  method: string,
  url: string,
  extras: { nonce?: string; timestamp?: string } = {},
): string {
  const params: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: extras.nonce ?? randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: extras.timestamp ?? Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };
  const baseParams = Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");
  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(baseParams)].join("&");
  const signingKey = `${percentEncode(credentials.apiSecret)}&${percentEncode(credentials.accessTokenSecret)}`;
  params.oauth_signature = createHmac("sha1", signingKey).update(baseString).digest("base64");
  const header = Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(params[key])}"`)
    .join(", ");
  return `OAuth ${header}`;
}

export class XSocialPublisher implements SocialPublisher {
  constructor(private readonly credentials: XUserCredentials) {}

  async createDraft(input: SocialDraftInput): Promise<SocialDraft> {
    return { id: `draft_x`, platform: input.platform, text: input.text, demo: false };
  }

  async schedule(input: SocialPublishInput & { scheduledAt: string }): Promise<PublishedPost> {
    return this.publish(input);
  }

  async publish(input: SocialPublishInput): Promise<PublishedPost> {
    if (input.platform !== "x") {
      throw new Error("Only the X publish path is live in this Rivera build");
    }
    const url = "https://api.x.com/2/tweets";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: xOAuthAuthorizationHeader(this.credentials, "POST", url),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input.text.slice(0, 280) }),
    });
    if (!response.ok) {
      throw new Error(`X publish failed (${response.status}): ${await response.text()}`);
    }
    const payload = (await response.json()) as { data?: { id?: string } };
    const id = payload.data?.id ?? "unknown";
    return {
      id,
      platform: "x",
      url: `https://x.com/i/web/status/${id}`,
      demo: false,
    };
  }
}

export function createSocialPublisher(): SocialPublisher {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  if (apiKey && apiSecret && accessToken && accessTokenSecret && process.env.DEMO_MODE !== "true") {
    return new XSocialPublisher({ apiKey, apiSecret, accessToken, accessTokenSecret });
  }
  return new DemoSocialPublisher();
}

export function isDemoPublisher(publisher: SocialPublisher): boolean {
  return publisher instanceof DemoSocialPublisher;
}
