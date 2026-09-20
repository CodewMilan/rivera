import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_SQL } from "./schema";

describe("database schema bundle", () => {
  it("stays in sync with schema.sql", () => {
    const disk = readFileSync(path.join(process.cwd(), "src/lib/database/schema.sql"), "utf8");
    expect(SCHEMA_SQL.trim()).toBe(disk.trim());
  });
});
