import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { createPostgresStore, migratePostgres } from "./postgres";

describe("phase 1 postgres persistence", () => {
  it.skipIf(!process.env.DATABASE_URL || process.env.RIVERA_STORE === "memory")(
    "creates an organization that can be read back",
    async () => {
      const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
      await migratePostgres(sql);
      const store = createPostgresStore(sql);
      const org = await createOrganizationFromIntake(store, {
        goal: "Build a developer tool for Stellar developers",
        deadline: "2026-10-19",
        budgetUsd: 500,
      });
      const read = await store.getOrganization(org.id);
      expect(read?.budgetCents).toBe(50000);
      await sql.end();
    },
  );
});
