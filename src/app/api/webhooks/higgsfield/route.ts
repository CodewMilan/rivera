import { applyMediaWebhook } from "@/lib/media/jobs";
import { errorJson, json, statusFromError } from "@/lib/http/json";
import { verifyHiggsfieldSignature } from "@/lib/providers/higgsfield";
import { getStore } from "@/lib/store";

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.text();
  const secret = process.env.HIGGSFIELD_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("x-higgsfield-signature");
    if (!verifyHiggsfieldSignature(body, signature, secret)) {
      return errorJson("Invalid webhook signature", 401);
    }
  }
  try {
    const payload = JSON.parse(body) as Record<string, unknown>;
    const store = await getStore();
    const job = await applyMediaWebhook(store, payload);
    return json({ job });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Webhook failed", statusFromError(error));
  }
}
