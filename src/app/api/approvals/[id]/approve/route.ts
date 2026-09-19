import { decideApproval } from "@/lib/approvals/engine";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const store = await getStore();
    return json({ approval: await decideApproval(store, id, "approved") });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Approve failed", statusFromError(error));
  }
}
