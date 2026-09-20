import { describe, expect, it } from "vitest";
import { suggestHiringRoles } from "./roles";

describe("suggestHiringRoles", () => {
  it("defaults to founding engineer when the brief has no hiring signal", () => {
    expect(suggestHiringRoles("Launch a local-first CLI for decoding failed simulations.")).toEqual([
      "Founding Engineer",
    ]);
  });

  it("infers roles from the launch brief", () => {
    expect(
      suggestHiringRoles("An AI agent with a Next.js frontend and a Figma-based design workflow."),
    ).toEqual(["AI Engineer", "Product Designer", "Full-stack Engineer"]);
  });
});
