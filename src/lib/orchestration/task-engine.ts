import { nowIso } from "@/lib/clock";
import type { Store } from "@/lib/store";
import type { Evaluation, Task, TaskStatus } from "@/types";

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["in_progress", "blocked", "failed"],
  in_progress: ["review", "blocked", "approval_required", "done", "failed"],
  blocked: ["todo", "in_progress", "failed"],
  review: ["done", "in_progress", "failed"],
  approval_required: ["in_progress", "done", "failed"],
  done: [],
  failed: ["todo"],
};

export function assertTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!TASK_TRANSITIONS[from].includes(to)) {
    throw new Error(`Illegal task transition: ${from} -> ${to}`);
  }
}

export function dependenciesSatisfied(task: Task, all: Task[]): boolean {
  return task.dependencies.every((id) => all.find((item) => item.id === id)?.status === "done");
}

export async function startTask(store: Store, task: Task, all: Task[]): Promise<Task> {
  if (!dependenciesSatisfied(task, all)) {
    if (task.status === "todo") {
      return store.updateTask(task.id, { status: "blocked", updatedAt: nowIso() });
    }
    return task;
  }
  if (task.status === "blocked") {
    assertTaskTransition("blocked", "in_progress");
  } else {
    assertTaskTransition(task.status, "in_progress");
  }
  return store.updateTask(task.id, { status: "in_progress", updatedAt: nowIso() });
}

export async function completeTask(
  store: Store,
  taskId: string,
  output: unknown,
  actualCostCents = 0,
  evaluation?: Evaluation,
): Promise<Task> {
  const task = await store.getTask(taskId);
  if (!task) throw new Error("Task not found");
  assertTaskTransition(task.status, "done");
  return store.updateTask(taskId, {
    status: "done",
    output,
    evaluation,
    actualCostCents,
    updatedAt: nowIso(),
  });
}

export async function failTask(store: Store, taskId: string, output: unknown): Promise<Task> {
  const task = await store.getTask(taskId);
  if (!task) throw new Error("Task not found");
  assertTaskTransition(task.status, "failed");
  return store.updateTask(taskId, { status: "failed", output, updatedAt: nowIso() });
}

export async function retryTask(store: Store, taskId: string): Promise<Task> {
  const task = await store.getTask(taskId);
  if (!task) throw new Error("Task not found");
  assertTaskTransition(task.status, "todo");
  return store.updateTask(taskId, { status: "todo", updatedAt: nowIso() });
}
