import { auth } from "@clerk/nextjs/server";
import { errorJson, json } from "@/lib/http/json";
import { buildHomeOverview } from "@/lib/home/overview";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

async function currentUserId(): Promise<string | undefined> {
  try {
    const { userId } = await auth();
    return userId ?? undefined;
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId) return json({ signedIn: false, organizations: [] } satisfies Awaited<ReturnType<typeof buildHomeOverview>>);

  const store = await getStore();
  const selectedId = new URL(request.url).searchParams.get("orgId") ?? undefined;
  try {
    return json(await buildHomeOverview(store, { userId, selectedId }));
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Could not load overview", 500);
  }
}
