import { requireOrgAccess } from "@/lib/auth/org-guard";
import { nowIso } from "@/lib/clock";
import { json } from "@/lib/http/json";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireOrgAccess(id);
  if (access instanceof Response) return access;
  const { store } = access;

  await store.deleteGitHubConnection(id);
  const config = await store.getBuildConfig(id);
  await store.upsertBuildConfig({
    ...config,
    repoFullName: undefined,
    repoUrl: undefined,
    branch: undefined,
    updatedAt: nowIso(),
  });
  return json({ ok: true, github: await store.getGitHubStatus(id) });
}
