export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export interface ResearchProvider {
  search(query: string): Promise<SearchResult[]>;
}

export const recordedSearchFixtures: Record<string, SearchResult[]> = {
  stellar: [
    {
      title: "Soroban transaction debugging is still painful",
      url: "https://github.com/stellar/soroban-tools/issues/1842",
      snippet:
        "Developers report that failed Soroban simulations dump opaque XDR and make it hard to isolate contract errors.",
    },
    {
      title: "Stellar Discord: local debug loop takes too long",
      url: "https://developers.stellar.org/docs/build/guides/testing",
      snippet:
        "Engineers want a 30-second loop from invoke to decoded events, footprints, and auth without a hosted stack.",
    },
  ],
};

export class FakeSearchProvider implements ResearchProvider {
  async search(query: string): Promise<SearchResult[]> {
    const key = query.toLowerCase().includes("stellar") || query.toLowerCase().includes("soroban")
      ? "stellar"
      : "stellar";
    return recordedSearchFixtures[key];
  }
}

export class TavilySearchProvider implements ResearchProvider {
  constructor(private readonly apiKey: string) {}

  async search(query: string): Promise<SearchResult[]> {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        max_results: 5,
      }),
    });
    if (!response.ok) {
      throw new Error(`Search provider failed (${response.status})`);
    }
    const payload = (await response.json()) as {
      results?: Array<{ title?: string; url?: string; content?: string }>;
    };
    return (payload.results ?? []).map((item) => ({
      title: item.title ?? "Untitled",
      url: item.url ?? "",
      snippet: item.content ?? "",
    }));
  }
}

export function createSearchProvider(): ResearchProvider {
  if (process.env.TAVILY_API_KEY && process.env.DEMO_MODE !== "true") {
    return new TavilySearchProvider(process.env.TAVILY_API_KEY);
  }
  return new FakeSearchProvider();
}
