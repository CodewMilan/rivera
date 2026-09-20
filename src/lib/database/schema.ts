/** Runtime copy of `schema.sql` so serverless deploys do not depend on reading the file from disk. */
export const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  run_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS media_jobs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider_job_id TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  organization_id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS gmail_connections (
  organization_id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS inbox_messages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  gmail_id TEXT NOT NULL,
  data JSONB NOT NULL,
  UNIQUE (organization_id, gmail_id)
);

CREATE INDEX IF NOT EXISTS runs_org_idx ON runs (organization_id);
CREATE INDEX IF NOT EXISTS events_org_idx ON events (organization_id);
CREATE INDEX IF NOT EXISTS media_jobs_provider_idx ON media_jobs (provider_job_id);
CREATE INDEX IF NOT EXISTS inbox_messages_org_idx ON inbox_messages (organization_id);
`;
