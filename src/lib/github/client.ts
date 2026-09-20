import type { GitHubRepoSummary } from "@/types";

async function ghFetch(accessToken: string, path: string): Promise<Response> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "rivera",
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${body.slice(0, 240)}`);
  }
  return response;
}

export async function githubViewer(accessToken: string): Promise<{ login: string }> {
  const response = await ghFetch(accessToken, "/user");
  const payload = (await response.json()) as { login?: string };
  if (!payload.login) throw new Error("Could not read the GitHub account login");
  return { login: payload.login };
}

type RepoPayload = {
  full_name: string;
  default_branch: string;
  private: boolean;
  html_url: string;
  pushed_at?: string;
  permissions?: { push?: boolean };
};

export async function githubListRepos(accessToken: string): Promise<GitHubRepoSummary[]> {
  const response = await ghFetch(
    accessToken,
    "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member",
  );
  const payload = (await response.json()) as RepoPayload[];
  return payload
    .filter((item) => item.permissions?.push !== false)
    .map((item) => ({
      fullName: item.full_name,
      defaultBranch: item.default_branch,
      private: item.private,
      htmlUrl: item.html_url,
      pushedAt: item.pushed_at,
    }));
}
