import { createHmac, timingSafeEqual } from "node:crypto";
import { createId } from "@/lib/ids";

export type MediaInput = {
  prompt: string;
  type: "image" | "video" | "edit";
  aspectRatio?: string;
  durationSeconds?: number;
  webhookUrl?: string;
  inputAssetUrls?: string[];
  costCeilingCents: number;
};

export type MediaStatus = {
  providerJobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  outputUrl?: string;
  previewUrl?: string;
  error?: string;
};

export type CreatedMediaJob = MediaStatus & {
  estimatedCostCents: number;
};

export interface MediaProvider {
  createVideo(input: MediaInput): Promise<CreatedMediaJob>;
  createImage(input: MediaInput): Promise<CreatedMediaJob>;
  editVideo(input: MediaInput): Promise<CreatedMediaJob>;
  getStatus(providerJobId: string): Promise<MediaStatus>;
  cancel(providerJobId: string): Promise<void>;
}

type FakeJob = MediaStatus & { estimatedCostCents: number };

export class FakeHiggsfieldProvider implements MediaProvider {
  private readonly jobs = new Map<string, FakeJob>();

  async createVideo(input: MediaInput): Promise<CreatedMediaJob> {
    return this.create(input, "video");
  }

  async createImage(input: MediaInput): Promise<CreatedMediaJob> {
    return this.create(input, "image");
  }

  async editVideo(input: MediaInput): Promise<CreatedMediaJob> {
    return this.create(input, "video");
  }

  async getStatus(providerJobId: string): Promise<MediaStatus> {
    const job = this.jobs.get(providerJobId);
    if (!job) throw new Error("Unknown Higgsfield job");
    return job;
  }

  async cancel(providerJobId: string): Promise<void> {
    const job = this.jobs.get(providerJobId);
    if (job && job.status !== "completed") {
      job.status = "failed";
      job.error = "Cancelled";
    }
  }

  complete(providerJobId: string, outputUrl?: string): MediaStatus {
    const job = this.jobs.get(providerJobId);
    if (!job) throw new Error("Unknown Higgsfield job");
    job.status = "completed";
    job.outputUrl = outputUrl ?? job.outputUrl;
    return job;
  }

  private create(input: MediaInput, kind: "image" | "video"): CreatedMediaJob {
    if (input.costCeilingCents < 25) {
      throw new Error("Media job exceeds cost ceiling");
    }
    const providerJobId = `hf_${createId()}`;
    const job: FakeJob = {
      providerJobId,
      status: "completed",
      outputUrl:
        kind === "video"
          ? "https://files.rivera.test/demo/launch.mp4"
          : "https://files.rivera.test/demo/launch.jpg",
      previewUrl: "https://files.rivera.test/demo/launch.jpg",
      estimatedCostCents: 40,
    };
    this.jobs.set(providerJobId, job);
    return job;
  }
}

export class HiggsfieldProvider implements MediaProvider {
  constructor(
    private readonly options: {
      keyId: string;
      keySecret: string;
      baseUrl: string;
    },
  ) {}

  async createVideo(input: MediaInput): Promise<CreatedMediaJob> {
    return this.submit("/bytedance/seedance-2.0/text-to-video", input, {
      prompt: input.prompt,
      resolution: "720p",
      duration: input.durationSeconds ?? 5,
      aspect_ratio: input.aspectRatio ?? "16:9",
    });
  }

  async createImage(input: MediaInput): Promise<CreatedMediaJob> {
    return this.submit("/higgsfield-ai/soul/standard", input, {
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio ?? "4:3",
      resolution: "720p",
    });
  }

  async editVideo(input: MediaInput): Promise<CreatedMediaJob> {
    return this.submit("/higgsfield-ai/soul/standard", input, {
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio ?? "16:9",
    });
  }

  async getStatus(providerJobId: string): Promise<MediaStatus> {
    const response = await fetch(
      `${this.options.baseUrl.replace(/\/$/, "")}/requests/${providerJobId}/status`,
      { headers: this.headers() },
    );
    if (!response.ok) {
      throw new Error(`Higgsfield status failed (${response.status})`);
    }
    return this.normalize(await response.json());
  }

  async cancel(providerJobId: string): Promise<void> {
    await fetch(`${this.options.baseUrl.replace(/\/$/, "")}/requests/${providerJobId}/cancel`, {
      method: "POST",
      headers: this.headers(),
    });
  }

  private async submit(
    path: string,
    input: MediaInput,
    body: Record<string, unknown>,
  ): Promise<CreatedMediaJob> {
    if (input.costCeilingCents < 25) {
      throw new Error("Media job exceeds cost ceiling");
    }
    const url = new URL(path, this.options.baseUrl.endsWith("/") ? this.options.baseUrl : `${this.options.baseUrl}/`);
    if (input.webhookUrl) url.searchParams.set("hf_webhook", input.webhookUrl);
    const response = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Higgsfield create failed (${response.status}): ${text}`);
    }
    const payload = this.normalize(await response.json());
    return { ...payload, estimatedCostCents: input.type === "video" ? 80 : 40 };
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Key ${this.options.keyId}:${this.options.keySecret}`,
      "Content-Type": "application/json",
    };
  }

  private normalize(payload: Record<string, unknown>): MediaStatus {
    const images = payload.images as Array<{ url?: string }> | undefined;
    const video = payload.video as { url?: string } | undefined;
    const outputUrl = video?.url ?? images?.[0]?.url;
    const status = String(payload.status ?? "queued");
    return {
      providerJobId: String(payload.request_id ?? ""),
      status:
        status === "completed"
          ? "completed"
          : status === "failed" || status === "nsfw"
            ? "failed"
            : status === "processing"
              ? "processing"
              : "queued",
      outputUrl,
      previewUrl: images?.[0]?.url ?? outputUrl,
      error: status === "nsfw" ? "NSFW result" : payload.error ? String(payload.error) : undefined,
    };
  }
}

export function verifyHiggsfieldSignature(
  body: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createMediaProvider(): MediaProvider {
  const keyId = process.env.HIGGSFIELD_API_KEY_ID;
  const keySecret = process.env.HIGGSFIELD_API_KEY_SECRET;
  if (keyId && keySecret && process.env.DEMO_MODE !== "true") {
    return new HiggsfieldProvider({
      keyId,
      keySecret,
      baseUrl: process.env.HIGGSFIELD_BASE_URL ?? "https://platform.higgsfield.ai",
    });
  }
  return new FakeHiggsfieldProvider();
}
