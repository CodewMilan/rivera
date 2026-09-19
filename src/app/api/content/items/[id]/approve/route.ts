import { reviewContent } from "@/lib/content/actions";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const store = await getStore();
    return json({ item: await reviewContent(store, id, "approve") });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Approve failed", statusFromError(error));
  }
}
