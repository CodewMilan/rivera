import { compileBuildBrief } from "@/lib/build/brief";
import { nowIso } from "@/lib/clock";
import { appendEvent } from "@/lib/events/log";
import { errorJson, json, readJson } from "@/lib/http/json";
import { createCursorAgent, cursorAgentUrl, mapCursorStatus } from "@/lib/providers/cursor";
import { getStore } from "@/lib/store";
import { createId } from "@/lib/ids";
import type { BuildRun } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  const builds = await store.listBuildRuns(id);
  return json({ builds });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  const body = ((await readJson(request)) ?? {}) as { promptOverride?: string; model?: string };

  const config = await store.getBuildConfig(id);
  if (!config.repoFullName || !config.repoUrl) {
    return errorJson("Pick a GitHub repo before starting a build", 400);
  }
  const secret = await store.getBuildSecret(id);
  if (!secret?.cursorApiKey) {
    return errorJson("Save your Cursor API key before starting a build", 400);
  }

  const tasks = await store.listTasks(id);
  const prompt =
    typeof body.promptOverride === "string" && body.promptOverride.trim()
      ? body.promptOverride
      : compileBuildBrief({
          organization: org,
          tasks,
          repoFullName: config.repoFullName,
          branch: config.branch,
        });

  const branch = config.branch || "main";
  const model = body.model || "composer-2";

  const record: BuildRun = {
    id: createId(),
    organizationId: id,
    provider: "cursor",
    status: "queued",
    prompt,
    repoFullName: config.repoFullName,
    branch,
    model,
    autoCreatePR: config.autoCreatePR,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await store.createBuildRun(record);
  await appendEvent(store, {
    organizationId: id,
    type: "build.dispatched",
    summary: `Sent build brief to Cursor for ${config.repoFullName}`,
    payload: { buildId: record.id, provider: "cursor", repo: config.repoFullName },
  });

  try {
    const agent = await createCursorAgent({
      apiKey: secret.cursorApiKey,
      prompt,
      model,
      repoUrl: config.repoUrl,
      startingRef: branch,
      autoCreatePR: config.autoCreatePR,
    });
    const mapped = mapCursorStatus(agent.status);
    const updated = await store.updateBuildRun(record.id, {
      status: mapped === "queued" || mapped === "running" ? "running" : mapped,
      cursorAgentId: agent.id,
      cursorStatus: agent.status,
      agentUrl: agent.url ?? cursorAgentUrl(agent.id),
      prUrl: agent.target?.prUrl ?? agent.source?.prUrl,
      summary: agent.summary,
    });
    return json({ build: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cursor dispatch failed";
    const updated = await store.updateBuildRun(record.id, {
      status: "failed",
      error: message,
    });
    await appendEvent(store, {
      organizationId: id,
      type: "build.failed",
      summary: `Cursor dispatch failed: ${message}`,
      payload: { buildId: record.id },
    });
    return errorJson(message, 502, { build: updated });
  }
}
