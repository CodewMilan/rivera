const KEY = "rivera.intake.draft";

export type IntakeDraft = {
  goal: string;
  capturedAt: string;
};

export function saveIntakeDraft(goal: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify({ goal, capturedAt: new Date().toISOString() } satisfies IntakeDraft));
}

export function readIntakeDraft(): IntakeDraft | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IntakeDraft>;
    if (typeof parsed.goal !== "string" || parsed.goal.trim().length < 10) return null;
    return {
      goal: parsed.goal,
      capturedAt: typeof parsed.capturedAt === "string" ? parsed.capturedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearIntakeDraft() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(KEY);
}
