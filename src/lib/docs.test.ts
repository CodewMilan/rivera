import { describe, expect, it } from "vitest";
import { allDocsPages, docsNeighbors, getDocsPage } from "./docs";

describe("docs nav", () => {
  it("has unique slugs and a home page", () => {
    const pages = allDocsPages();
    const slugs = pages.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(getDocsPage("")).toMatchObject({ href: "/docs", title: "Overview" });
  });

  it("walks prev and next in nav order", () => {
    expect(docsNeighbors("").next?.slug).toBe("quick-start");
    expect(docsNeighbors("safety").next).toBeUndefined();
    expect(docsNeighbors("safety").prev?.slug).toBe("api");
  });
});
