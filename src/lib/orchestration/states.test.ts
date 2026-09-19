import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, isTerminal } from "./states";

describe("phase 2 state machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransition("intake", "planning")).toBe(true);
    expect(canTransition("planning", "research")).toBe(true);
    expect(canTransition("content_plan", "review")).toBe(true);
    expect(canTransition("review", "complete")).toBe(true);
  });

  it("throws on illegal transitions", () => {
    expect(() => assertTransition("intake", "published")).toThrow(/Illegal run transition/);
    expect(() => assertTransition("complete", "planning")).toThrow(/Illegal run transition/);
  });

  it("treats complete failed and cancelled as terminal", () => {
    expect(isTerminal("complete")).toBe(true);
    expect(isTerminal("failed")).toBe(true);
    expect(isTerminal("review")).toBe(false);
  });
});
