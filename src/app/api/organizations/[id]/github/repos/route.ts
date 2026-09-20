import { requireOrgAccess } from "@/lib/auth/org-guard";
import { decryptSecret } from "@/lib/crypto/secret";
import { errorJson, json } from "@/lib/http/json";
import { githubListRepos } from "@/lib/github/client";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireOrgAccess(id);
  if (access instanceof Response) return access;
  const { store } = access;

  const connection = await store.getGitHubConnection(id);
  if (!connection) return errorJson("Connect GitHub first", 400);
  try {
    const repos = await githubListRepos(decryptSecret(connection.accessToken));
    return json({ repos });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "GitHub API failed", 502);
  }
}
