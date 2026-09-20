import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  await store.deleteGitHubConnection(id);
  const config = await store.getBuildConfig(id);
  await store.upsertBuildConfig({
    ...config,
    repoFullName: undefined,
    repoUrl: undefined,
    branch: undefined,
    updatedAt: new Date().toISOString(),
  });
  return json({ ok: true, github: await store.getGitHubStatus(id) });
}
