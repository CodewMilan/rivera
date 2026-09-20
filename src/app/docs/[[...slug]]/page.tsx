import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DOCS_ARTICLES } from "@/components/docs/articles";
import { DocsArticle } from "@/components/docs/shell";
import { allDocsPages, getDocsPage } from "@/lib/docs";

export const dynamicParams = false;

type DocsParams = { slug?: string[] };

export function generateStaticParams() {
  return allDocsPages().map((page) => ({
    slug: page.slug ? [page.slug] : [],
  }));
}

export async function generateMetadata({ params }: { params: Promise<DocsParams> }): Promise<Metadata> {
  const slug = slugFrom(await params);
  const page = getDocsPage(slug);
  if (!page) return { title: "Docs | Rivera" };
  return {
    title: `${page.title} | Rivera Docs`,
    description: page.description,
  };
}

export default async function DocsPage({ params }: { params: Promise<DocsParams> }) {
  const slug = slugFrom(await params);
  const page = getDocsPage(slug);
  const Article = DOCS_ARTICLES[slug];
  if (!page || !Article) notFound();

  return (
    <DocsArticle slug={slug}>
      <Article />
    </DocsArticle>
  );
}

function slugFrom(params: DocsParams) {
  return params.slug?.filter(Boolean).join("/") ?? "";
}
