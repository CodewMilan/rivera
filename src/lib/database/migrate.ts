import { readFileSync } from "node:fs";
import { createSql } from "@/lib/database/connection";
import { migratePostgres } from "@/lib/store/postgres";

function loadDotEnv() {
  try {
    const text = readFileSync(".env", "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // App and Next.js still load .env themselves.
  }
}

loadDotEnv();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to migrate");
  }
  const sql = createSql(url, { max: 1 });
  await migratePostgres(sql);
  await sql.end();
  console.log("Rivera schema is ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
