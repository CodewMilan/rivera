export type DocsPage = {
  slug: string;
  href: string;
  title: string;
  description: string;
};

export type DocsSection = {
  title: string;
  pages: DocsPage[];
};

function page(slug: string, title: string, description: string): DocsPage {
  return {
    slug,
    href: slug ? `/docs/${slug}` : "/docs",
    title,
    description,
  };
}

export const DOCS_NAV: DocsSection[] = [
  {
    title: "Start",
    pages: [
      page("", "Overview", "What Rivera is, what a run produces, and how to read these docs."),
      page("quick-start", "Quick start", "Sign in, submit a goal, and watch the organization work."),
      page("demo-mode", "Demo mode", "When fixtures run, how they are labeled, and how to turn live providers on."),
    ],
  },
  {
    title: "Product",
    pages: [
      page("runs", "How a run works", "Phases, caps, resume, and what stops a run."),
      page("agents", "Agents", "The specialist org Rivera staffs for every goal."),
      page("dashboard", "Dashboard", "Overview, tasks, timeline, decisions, content, and the final report."),
      page("approvals", "Approvals", "Human gates before publish, spend, and other irreversible actions."),
      page("content", "Content and publishing", "Campaign drafts, media jobs, review, schedule, and publish."),
      page("inbox", "Inbox", "Gmail connect, relevance scoring, and the sample inbox."),
    ],
  },
  {
    title: "Operate",
    pages: [
      page("environment", "Environment", "Required secrets, optional tools, and how to deploy."),
      page("api", "API", "HTTP routes the dashboard uses."),
      page("safety", "Safety", "What agents may draft, and what always waits for you."),
    ],
  },
];

export function allDocsPages(): DocsPage[] {
  return DOCS_NAV.flatMap((section) => section.pages);
}

export function getDocsPage(slug: string): DocsPage | undefined {
  return allDocsPages().find((item) => item.slug === slug);
}

export function docsNeighbors(slug: string): { prev?: DocsPage; next?: DocsPage } {
  const pages = allDocsPages();
  const index = pages.findIndex((item) => item.slug === slug);
  if (index < 0) return {};
  return {
    prev: index > 0 ? pages[index - 1] : undefined,
    next: index < pages.length - 1 ? pages[index + 1] : undefined,
  };
}
