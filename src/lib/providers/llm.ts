import { agentOutputSchema, parseJsonFromModel } from "@/lib/agents/schema";
import type { AgentOutput } from "@/types";

export type LLMCompleteInput = {
  system: string;
  user: string;
};

export type LLMCompleteResult = {
  text: string;
  costCents: number;
  demo: boolean;
};

export interface LLMProvider {
  complete(input: LLMCompleteInput): Promise<LLMCompleteResult>;
}

export class FakeLLMProvider implements LLMProvider {
  constructor(private readonly responder: (input: LLMCompleteInput) => string) {}

  async complete(input: LLMCompleteInput): Promise<LLMCompleteResult> {
    return {
      text: this.responder(input),
      costCents: 2,
      demo: true,
    };
  }
}

export class OpenAICompatibleProvider implements LLMProvider {
  constructor(
    private readonly options: {
      apiKey: string;
      baseUrl: string;
      model: string;
    },
  ) {}

  async complete(input: LLMCompleteInput): Promise<LLMCompleteResult> {
    const response = await fetch(`${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.options.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM provider failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw new Error("LLM provider returned an empty completion");
    const tokens = payload.usage?.total_tokens ?? 800;
    return {
      text,
      costCents: Math.max(1, Math.round(tokens / 200)),
      demo: false,
    };
  }
}

export function createLLMProvider(responder?: (input: LLMCompleteInput) => string): LLMProvider {
  const apiKey = process.env.LLM_API_KEY;
  if (apiKey && !responder) {
    return new OpenAICompatibleProvider({
      apiKey,
      baseUrl: process.env.LLM_BASE_URL ?? "https://api.openai.com/v1",
      model: process.env.LLM_MODEL ?? "gpt-4o-mini",
    });
  }
  return new FakeLLMProvider(responder ?? defaultDemoResponder);
}

export async function completeJson<T>(
  provider: LLMProvider,
  input: LLMCompleteInput,
  parse: (value: unknown) => T,
  retries = 1,
): Promise<{ value: T; costCents: number; demo: boolean }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const result = await provider.complete(input);
    try {
      return {
        value: parse(parseJsonFromModel(result.text)),
        costCents: result.costCents,
        demo: result.demo,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to parse model JSON");
}

export function parseAgentOutput(value: unknown): AgentOutput {
  return agentOutputSchema.parse(value);
}

function defaultDemoResponder(input: LLMCompleteInput): string {
  return JSON.stringify({
    status: "success",
    summary: `Demo completion for: ${input.user.slice(0, 80)}`,
    findings: [],
    evidence: [],
    risks: [],
    recommendation: "Continue the Rivera run.",
    confidence: 0.7,
    artifacts: [],
    estimatedCostCents: 2,
  });
}
