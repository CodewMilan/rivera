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

export class XSocialPublisher implements SocialPublisher {
  constructor(private readonly bearerToken: string) {}

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
    const response = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
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
  const token = process.env.X_BEARER_TOKEN;
  if (token && process.env.DEMO_MODE !== "true") {
    return new XSocialPublisher(token);
  }
  return new DemoSocialPublisher();
}

export function isDemoPublisher(publisher: SocialPublisher): boolean {
  return publisher instanceof DemoSocialPublisher;
}
