/**
 * Thin client for the Cursor Cloud Agents REST API.
 *
 * Docs: https://cursor.com/docs/cloud-agent/api/endpoints
 *
 * Authentication uses Basic auth with the Cursor API key as the username and
 * an empty password (`curl -u YOUR_API_KEY:`). We call the REST API directly
 * rather than depending on `@cursor/sdk` so this works from Next.js route
 * handlers and edge-adjacent runtimes without native subprocess spawn.
 */

const DEFAULT_BASE = "https://api.cursor.com";
const DEFAULT_MODEL = "composer-2";

export type CursorAgent = {
  id: string;
  status: string;
  target?: {
    prUrl?: string;
    branchName?: string;
  };
  source?: {
    prUrl?: string;
    branchName?: string;
  };
  summary?: string;
  url?: string;
};

export type CreateAgentInput = {
  apiKey: string;
  prompt: string;
  model?: string;
  repoUrl: string;
  startingRef: string;
  autoCreatePR?: boolean;
};

export type CursorClientError = Error & {
  status?: number;
  code?: string;
};

function cursorBase(): string {
  return (process.env.CURSOR_API_BASE ?? DEFAULT_BASE).replace(/\/$/, "");
}

function authHeader(apiKey: string): string {
  const token = Buffer.from(`${apiKey}:`).toString("base64");
  return `Basic ${token}`;
}

function fail(status: number, body: unknown): CursorClientError {
  const message =
    (typeof body === "object" && body && "message" in body && String((body as { message: unknown }).message)) ||
    (typeof body === "object" && body && "error" in body && String((body as { error: unknown }).error)) ||
    `Cursor API error (${status})`;
  const error = new Error(message) as CursorClientError;
  error.status = status;
  if (typeof body === "object" && body && "code" in body) {
    error.code = String((body as { code: unknown }).code);
  }
  return error;
}

async function cursorFetch(apiKey: string, path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${cursorBase()}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(apiKey),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  const parsed: unknown = text ? safeJson(text) : null;
  if (!response.ok) throw fail(response.status, parsed);
  return parsed;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeAgent(payload: unknown): CursorAgent {
  const record = (payload ?? {}) as Record<string, unknown>;
  const agent = (record.agent as Record<string, unknown> | undefined) ?? record;
  return {
    id: String(agent.id ?? ""),
    status: String(agent.status ?? "queued"),
    target: agent.target as CursorAgent["target"],
    source: agent.source as CursorAgent["source"],
    summary: typeof agent.summary === "string" ? agent.summary : undefined,
    url: typeof agent.url === "string" ? agent.url : undefined,
  };
}

export async function createCursorAgent(input: CreateAgentInput): Promise<CursorAgent> {
  const body = {
    prompt: { text: input.prompt },
    model: { id: input.model ?? DEFAULT_MODEL },
    repos: [
      {
        url: input.repoUrl,
        startingRef: input.startingRef,
      },
    ],
    autoCreatePR: input.autoCreatePR ?? true,
  };
  const payload = await cursorFetch(input.apiKey, "/v1/agents", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeAgent(payload);
}

export async function getCursorAgent(apiKey: string, agentId: string): Promise<CursorAgent> {
  const payload = await cursorFetch(apiKey, `/v1/agents/${encodeURIComponent(agentId)}`);
  return normalizeAgent(payload);
}

/** Best-effort human-facing URL for the Cursor agent viewer. */
export function cursorAgentUrl(agentId: string): string {
  return `https://cursor.com/agents/${encodeURIComponent(agentId)}`;
}

/**
 * Map Cursor's status vocabulary onto Rivera's BuildRunStatus so the dashboard
 * doesn't have to know Cursor-specific strings. Anything unknown maps to
 * `running` to avoid falsely marking a build finished.
 */
export function mapCursorStatus(status: string): "queued" | "running" | "completed" | "failed" | "cancelled" {
  const normalized = status.toLowerCase();
  if (["completed", "succeeded", "success", "finished"].includes(normalized)) return "completed";
  if (["failed", "error", "errored"].includes(normalized)) return "failed";
  if (["cancelled", "canceled", "aborted"].includes(normalized)) return "cancelled";
  if (["queued", "pending", "starting"].includes(normalized)) return "queued";
  return "running";
}
