import { compileBuildBrief } from "@/lib/build/brief";
import { errorJson, json } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  const tasks = await store.listTasks(id);
  const config = await store.getBuildConfig(id);
  const brief = compileBuildBrief({
    organization: org,
    tasks,
    repoFullName: config.repoFullName,
    branch: config.branch,
  });
  return json({ brief });
}
