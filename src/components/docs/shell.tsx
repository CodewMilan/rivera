"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DOCS_NAV, docsNeighbors, getDocsPage } from "@/lib/docs";

export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1370px] flex-col gap-10 px-[30px] pb-24 pt-8 lg:flex-row lg:gap-16">
      <DocsNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function DocsNav() {
  return (
    <>
      <details className="rounded-[10px] border border-[rgba(194,184,255,0.22)] bg-[#1f1c26] p-4 lg:hidden">
        <summary className="cursor-pointer text-[15px] leading-[24px] text-[#f4f2f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]">
          Documentation
        </summary>
        <div className="mt-4">
          <NavGroups />
        </div>
      </details>
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <nav aria-label="Documentation" className="sticky top-8">
          <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Docs</p>
          <NavGroups />
        </nav>
      </aside>
    </>
  );
}

function NavGroups() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      {DOCS_NAV.map((section) => (
        <div key={section.title}>
          <p className="text-[12px] uppercase tracking-wide text-[#928c97]">{section.title}</p>
          <ul className="mt-2 space-y-1">
            {section.pages.map((page) => {
              const current = pathname === page.href;
              return (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "block min-h-11 rounded-[5px] px-2 py-2 text-[15px] leading-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]",
                      current ? "bg-[rgba(194,184,255,0.12)] text-[#c2b8ff]" : "text-[#f4f2f0] hover:text-[#c2b8ff]",
                    )}
                  >
                    {page.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function DocsArticle({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const page = getDocsPage(slug);
  const { prev, next } = docsNeighbors(slug);
  if (!page) return children;

  return (
    <article className="max-w-[720px]">
      <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Documentation</p>
      <h1 className="mt-1 text-[40px] font-normal leading-[48px] tracking-[-1.4px] text-[#f4f2f0] md:text-[49px] md:leading-[60px] md:tracking-[-1.62px]">
        {page.title}
      </h1>
      <p className="mt-4 text-[18px] leading-[28px] text-[#928c97]">{page.description}</p>
      <div className="mt-10 text-[16px] leading-[27px] text-[#928c97] [&_a]:text-[#c2b8ff] [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mt-10 [&_h2]:text-[24px] [&_h2]:font-normal [&_h2]:leading-[32px] [&_h2]:text-[#f4f2f0] [&_h3]:mt-8 [&_h3]:text-[18px] [&_h3]:font-normal [&_h3]:text-[#f4f2f0] [&_p+p]:mt-4">
        {children}
      </div>
      <nav aria-label="Adjacent docs" className="mt-16 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={prev.href}
            className="rounded-[10px] border border-[rgba(194,184,255,0.22)] bg-[#1f1c26] px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
          >
            <p className="text-[12px] uppercase tracking-wide text-[#928c97]">Previous</p>
            <p className="mt-1 text-[16px] text-[#f4f2f0]">{prev.title}</p>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.href}
            className="rounded-[10px] border border-[rgba(194,184,255,0.22)] bg-[#1f1c26] px-4 py-4 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
          >
            <p className="text-[12px] uppercase tracking-wide text-[#928c97]">Next</p>
            <p className="mt-1 text-[16px] text-[#f4f2f0]">{next.title}</p>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
