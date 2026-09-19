import postgres from "postgres";
import { migratePostgres } from "@/lib/store/postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to migrate");
  }
  const sql = postgres(url, { max: 1 });
  await migratePostgres(sql);
  await sql.end();
  console.log("Rivera schema is ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
