import { describe, expect, it } from "vitest";
import { postgresConnectOptions } from "./connection";

describe("postgres connection options", () => {
  it("skips SSL for localhost", () => {
    expect(postgresConnectOptions("postgres://milan@localhost/rivera").ssl).toBeUndefined();
  });

  it("requires SSL for hosted databases", () => {
    expect(postgresConnectOptions("postgres://user:pass@ep-cool.aws.neon.tech/neondb").ssl).toBe("require");
  });

  it("disables prepared statements for poolers", () => {
    expect(
      postgresConnectOptions("postgres://user:pass@ep-cool-pooler.aws.neon.tech/neondb?sslmode=require").prepare,
    ).toBe(false);
  });
});
