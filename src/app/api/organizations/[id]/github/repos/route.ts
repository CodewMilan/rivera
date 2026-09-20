import { errorJson, json } from "@/lib/http/json";
import { githubListRepos } from "@/lib/github/client";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  const connection = await store.getGitHubConnection(id);
  if (!connection) return errorJson("Connect GitHub first", 400);
  try {
    const repos = await githubListRepos(connection.accessToken);
    return json({ repos });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "GitHub API failed", 502);
  }
}
