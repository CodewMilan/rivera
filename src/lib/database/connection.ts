import postgres, { type Sql } from "postgres";

export type PostgresConnectOptions = {
  max?: number;
  idle_timeout?: number;
  max_lifetime?: number;
  connect_timeout?: number;
  ssl?: "require";
  prepare?: boolean;
};

export function postgresConnectOptions(url: string): PostgresConnectOptions {
  const local = /@localhost\b|@127\.0\.0\.1\b/.test(url);
  const sslMode = url.match(/[?&]sslmode=([^&]+)/i)?.[1];
  const pooled =
    /pooler/i.test(url) ||
    /[?&]pgbouncer=true/i.test(url) ||
    /:6543\b/.test(url);
  const ssl =
    sslMode === "disable"
      ? undefined
      : local && sslMode !== "require"
        ? undefined
        : "require";

  const options: PostgresConnectOptions = {
    max: Number(process.env.PG_POOL_MAX ?? (process.env.VERCEL ? 1 : 5)),
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
  };
  if (ssl) options.ssl = ssl;
  if (pooled) options.prepare = false;
  return options;
}

export function createSql(url: string, overrides?: PostgresConnectOptions): Sql {
  return postgres(url, { ...postgresConnectOptions(url), ...overrides });
}
