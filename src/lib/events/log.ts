import { nowIso } from "@/lib/clock";
import { createId } from "@/lib/ids";
import type { Store } from "@/lib/store";
import type { EventRecord } from "@/types";

export async function appendEvent(
  store: Store,
  input: {
    organizationId: string;
    runId?: string;
    type: string;
    summary: string;
    payload?: unknown;
  },
): Promise<EventRecord> {
  return store.appendEvent({
    id: createId(),
    organizationId: input.organizationId,
    runId: input.runId,
    type: input.type,
    summary: input.summary,
    payload: input.payload ?? {},
    createdAt: nowIso(),
  });
}
