import type { SearchResult } from "./search";

export async function searchGithubIssues(query: string): Promise<SearchResult[]> {
  const url = new URL("https://api.github.com/search/issues");
  url.searchParams.set("q", query);
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "rivera",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  if (process.env.DEMO_MODE === "true" || process.env.VITEST) {
    return [
      {
        title: "Better Soroban simulation error decoding",
        url: "https://github.com/stellar/soroban-tools/issues/1842",
        snippet: "CLI output is too raw for day-to-day contract debugging.",
      },
    ];
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub search failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    items?: Array<{ title?: string; html_url?: string; body?: string }>;
  };
  return (payload.items ?? []).slice(0, 5).map((item) => ({
    title: item.title ?? "Issue",
    url: item.html_url ?? "",
    snippet: (item.body ?? "").slice(0, 240),
  }));
}
