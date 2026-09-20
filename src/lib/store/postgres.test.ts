import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { createPostgresStore, migratePostgres } from "./postgres";
import type { Store } from "./types";

const DATABASE_URL = process.env.DATABASE_URL ?? (process.env.CI ? "" : "postgres://milan@localhost/rivera");

describe.skipIf(!DATABASE_URL)("phase 1 postgres persistence", () => {
  let sql: Sql;
  let store: Store;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sql = postgres(DATABASE_URL, { max: 1 });
    store = createPostgresStore(sql);
    await migratePostgres(sql);
  });

  afterAll(async () => {
    if (!sql) return;
    for (const id of createdIds) {
      await sql`DELETE FROM events WHERE organization_id = ${id}`;
      await sql`DELETE FROM inbox_messages WHERE organization_id = ${id}`;
      await sql`DELETE FROM gmail_connections WHERE organization_id = ${id}`;
      await sql`DELETE FROM organizations WHERE id = ${id}`;
    }
    await sql.end({ timeout: 2 });
  });

  it("persists an organization and its created event", async () => {
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a developer tool for Stellar developers",
      deadline: "2026-10-19",
      budgetUsd: 500,
      targetUser: "Soroban developers",
    });
    createdIds.push(org.id);

    const read = await store.getOrganization(org.id);
    expect(read?.id).toBe(org.id);
    expect(read?.budgetCents).toBe(50000);
    expect(read?.goal).toContain("Stellar");

    const events = await store.listEvents(org.id);
    expect(events.some((event) => event.type === "organization.created")).toBe(true);
  });

  it("survives a new database connection (refresh)", async () => {
    const org = await createOrganizationFromIntake(store, {
      goal: "Build a debugger that survives a page refresh",
      deadline: "2026-10-19",
      budgetUsd: 250,
    });
    createdIds.push(org.id);

    const freshSql = postgres(DATABASE_URL, { max: 1 });
    const freshStore = createPostgresStore(freshSql);
    const read = await freshStore.getOrganization(org.id);
    expect(read?.budgetCents).toBe(25000);
    expect(read?.goal).toContain("refresh");
    await freshSql.end({ timeout: 2 });
  });
});
