import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const campaign = await store.getCampaign(id);
  if (!campaign) return errorJson("Campaign not found", 404);
  return json({
    campaign,
    items: await store.listContentItemsByCampaign(id),
  });
}
