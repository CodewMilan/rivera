import { appendEvent } from "@/lib/events/log";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { retryTask } from "@/lib/orchestration/task-engine";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  try {
    const task = await retryTask(store, id);
    await appendEvent(store, {
      organizationId: task.organizationId,
      runId: task.runId,
      type: "task.retry",
      summary: `Retrying ${task.title}`,
      payload: { taskId: id },
    });
    return json({ task });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Retry failed", statusFromError(error));
  }
}
