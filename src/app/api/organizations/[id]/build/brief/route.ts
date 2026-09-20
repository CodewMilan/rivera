import { requireOrgAccess } from "@/lib/auth/org-guard";
import { compileBuildBrief } from "@/lib/build/brief";
import { json } from "@/lib/http/json";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireOrgAccess(id);
  if (access instanceof Response) return access;
  const { store, organization } = access;
  const tasks = await store.listTasks(id);
  const config = await store.getBuildConfig(id);
  const brief = compileBuildBrief({
    organization,
    tasks,
    repoFullName: config.repoFullName,
    branch: config.branch,
  });
  return json({ brief });
}
