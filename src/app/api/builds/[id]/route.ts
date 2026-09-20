import { appendEvent } from "@/lib/events/log";
import { errorJson, json } from "@/lib/http/json";
import { cursorAgentUrl, getCursorAgent, mapCursorStatus } from "@/lib/providers/cursor";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const build = await store.getBuildRun(id);
  if (!build) return errorJson("Build not found", 404);
  if (!build.cursorAgentId || build.status === "completed" || build.status === "failed" || build.status === "cancelled") {
    return json({ build });
  }
  const secret = await store.getBuildSecret(build.organizationId);
  if (!secret?.cursorApiKey) return json({ build });

  try {
    const agent = await getCursorAgent(secret.cursorApiKey, build.cursorAgentId);
    const mapped = mapCursorStatus(agent.status);
    const nextPr = agent.target?.prUrl ?? agent.source?.prUrl ?? build.prUrl;
    const patch = {
      status: mapped === "queued" ? "queued" as const : mapped,
      cursorStatus: agent.status,
      prUrl: nextPr,
      agentUrl: agent.url ?? build.agentUrl ?? cursorAgentUrl(agent.id),
      summary: agent.summary ?? build.summary,
      completedAt: mapped === "completed" || mapped === "failed" || mapped === "cancelled" ? new Date().toISOString() : build.completedAt,
    };
    const updated = await store.updateBuildRun(build.id, patch);
    if (mapped === "completed" && build.status !== "completed") {
      await appendEvent(store, {
        organizationId: build.organizationId,
        type: "build.completed",
        summary: nextPr ? `Cursor opened a PR: ${nextPr}` : "Cursor build completed",
        payload: { buildId: build.id, prUrl: nextPr },
      });
    }
    if (mapped === "failed" && build.status !== "failed") {
      await appendEvent(store, {
        organizationId: build.organizationId,
        type: "build.failed",
        summary: "Cursor build failed",
        payload: { buildId: build.id, cursorStatus: agent.status },
      });
    }
    return json({ build: updated });
  } catch (error) {
    return json({ build, warning: error instanceof Error ? error.message : "poll_failed" });
  }
}
