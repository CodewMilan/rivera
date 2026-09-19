import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const report = await store.getReport(id);
  if (!report) return errorJson("Report not ready", 404);
  return json({ report });
}
