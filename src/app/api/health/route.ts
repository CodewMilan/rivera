import { createSql } from "@/lib/database/connection";
import { json } from "@/lib/http/json";
import { isMemoryStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const memory = isMemoryStore();
  const checks: Record<string, string> = {
    store: memory ? "memory" : "postgres",
    demoMode: process.env.DEMO_MODE === "true" || !process.env.LLM_API_KEY ? "true" : "false",
    clerk: process.env.CLERK_SECRET_KEY ? "configured" : "missing",
  };

  if (memory) {
    const production = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
    if (production && process.env.ALLOW_MEMORY_STORE !== "true" && process.env.RIVERA_STORE !== "memory") {
      return json({ ok: false, error: "DATABASE_URL is required in production", checks }, 503);
    }
    return json({ ok: true, checks });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return json({ ok: false, error: "DATABASE_URL is required", checks }, 503);
  }
  const sql = createSql(url, { max: 1 });
  try {
    await sql`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    checks.database = error instanceof Error ? error.message : "unreachable";
    return json({ ok: false, checks }, 503);
  } finally {
    await sql.end({ timeout: 2 });
  }

  return json({ ok: true, checks });
}
