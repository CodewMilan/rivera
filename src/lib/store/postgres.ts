import { type Sql } from "postgres";
import { createSql } from "@/lib/database/connection";
import { SCHEMA_SQL } from "@/lib/database/schema";
import type {
  Agent,
  Approval,
  Asset,
  ContentCampaign,
  ContentItem,
  Decision,
  EventRecord,
  FinalReport,
  MediaJob,
  Organization,
  OrganizationSnapshot,
  Run,
  Task,
} from "@/types";
import type { Store } from "./types";

function row<T>(result: { data: T }[] | undefined): T | undefined {
  return result?.[0]?.data;
}

function jsonValue(sql: Sql, value: unknown) {
  return sql.json(JSON.parse(JSON.stringify(value)));
}

export async function migratePostgres(sql: Sql): Promise<void> {
  await sql.unsafe(SCHEMA_SQL);
}

export function createPostgresStore(sql: Sql): Store {
  return {
    async createOrganization(org) {
      await sql`INSERT INTO organizations (id, data) VALUES (${org.id}, ${jsonValue(sql, org)})`;
      return org;
    },
    async getOrganization(id) {
      const rows = await sql<{ data: Organization }[]>`SELECT data FROM organizations WHERE id = ${id}`;
      return row(rows);
    },
    async updateOrganization(id, patch) {
      const current = await this.getOrganization(id);
      if (!current) throw new Error("Organization not found");
      const next = { ...current, ...patch };
      await sql`UPDATE organizations SET data = ${jsonValue(sql, next)} WHERE id = ${id}`;
      return next;
    },
    async listOrganizations() {
      const rows = await sql<{ data: Organization }[]>`SELECT data FROM organizations`;
      return rows.map((item) => item.data);
    },

    async createRun(run) {
      await sql`INSERT INTO runs (id, organization_id, started_at, data) VALUES (${run.id}, ${run.organizationId}, ${run.startedAt}, ${jsonValue(sql, run)})`;
      return run;
    },
    async getRun(id) {
      const rows = await sql<{ data: Run }[]>`SELECT data FROM runs WHERE id = ${id}`;
      return row(rows);
    },
    async getLatestRun(organizationId) {
      const rows = await sql<{ data: Run }[]>`
        SELECT data FROM runs
        WHERE organization_id = ${organizationId}
        ORDER BY started_at DESC
        LIMIT 1
      `;
      return row(rows);
    },
    async updateRun(id, patch) {
      const current = await this.getRun(id);
      if (!current) throw new Error("Run not found");
      const next = { ...current, ...patch };
      await sql`UPDATE runs SET data = ${jsonValue(sql, next)} WHERE id = ${id}`;
      return next;
    },

    async createAgent(agent) {
      await sql`INSERT INTO agents (id, organization_id, data) VALUES (${agent.id}, ${agent.organizationId}, ${jsonValue(sql, agent)})`;
      return agent;
    },
    async getAgent(id) {
      const rows = await sql<{ data: Agent }[]>`SELECT data FROM agents WHERE id = ${id}`;
      return row(rows);
    },
    async listAgents(organizationId) {
      const rows = await sql<{ data: Agent }[]>`SELECT data FROM agents WHERE organization_id = ${organizationId}`;
      return rows.map((item) => item.data);
    },
    async updateAgent(id, patch) {
      const current = await this.getAgent(id);
      if (!current) throw new Error("Agent not found");
      const next = { ...current, ...patch };
      await sql`UPDATE agents SET data = ${jsonValue(sql, next)} WHERE id = ${id}`;
      return next;
    },

    async createTask(task) {
      await sql`INSERT INTO tasks (id, organization_id, run_id, data) VALUES (${task.id}, ${task.organizationId}, ${task.runId}, ${jsonValue(sql, task)})`;
      return task;
    },
    async getTask(id) {
      const rows = await sql<{ data: Task }[]>`SELECT data FROM tasks WHERE id = ${id}`;
      return row(rows);
    },
    async listTasks(organizationId) {
      const rows = await sql<{ data: Task }[]>`SELECT data FROM tasks WHERE organization_id = ${organizationId}`;
      return rows.map((item) => item.data);
    },
    async listTasksByRun(runId) {
      const rows = await sql<{ data: Task }[]>`SELECT data FROM tasks WHERE run_id = ${runId}`;
      return rows.map((item) => item.data);
    },
    async updateTask(id, patch) {
      const current = await this.getTask(id);
      if (!current) throw new Error("Task not found");
      const next = { ...current, ...patch };
      await sql`UPDATE tasks SET data = ${jsonValue(sql, next)} WHERE id = ${id}`;
      return next;
    },

    async appendEvent(event) {
      await sql`INSERT INTO events (id, organization_id, run_id, created_at, data) VALUES (${event.id}, ${event.organizationId}, ${event.runId ?? null}, ${event.createdAt}, ${jsonValue(sql, event)})`;
      return event;
    },
    async listEvents(organizationId) {
      const rows = await sql<{ data: EventRecord }[]>`
        SELECT data FROM events WHERE organization_id = ${organizationId} ORDER BY created_at ASC
      `;
      return rows.map((item) => item.data);
    },
    async listEventsByRun(runId) {
      const rows = await sql<{ data: EventRecord }[]>`
        SELECT data FROM events WHERE run_id = ${runId} ORDER BY created_at ASC
      `;
      return rows.map((item) => item.data);
    },

    async createDecision(decision) {
      await sql`INSERT INTO decisions (id, organization_id, data) VALUES (${decision.id}, ${decision.organizationId}, ${jsonValue(sql, decision)})`;
      return decision;
    },
    async getDecision(id) {
      const rows = await sql<{ data: Decision }[]>`SELECT data FROM decisions WHERE id = ${id}`;
      return row(rows);
    },
    async listDecisions(organizationId) {
      const rows = await sql<{ data: Decision }[]>`SELECT data FROM decisions WHERE organization_id = ${organizationId}`;
      return rows.map((item) => item.data);
    },
    async updateDecision(id, patch) {
      const current = await this.getDecision(id);
      if (!current) throw new Error("Decision not found");
      const next = { ...current, ...patch };
      await sql`UPDATE decisions SET data = ${jsonValue(sql, next)} WHERE id = ${id}`;
      return next;
    },

    async createApproval(approval) {
      await sql`INSERT INTO approvals (id, organization_id, target_id, action_type, status, data) VALUES (${approval.id}, ${approval.organizationId}, ${approval.targetId}, ${approval.actionType}, ${approval.status}, ${jsonValue(sql, approval)})`;
      return approval;
    },
    async getApproval(id) {
      const rows = await sql<{ data: Approval }[]>`SELECT data FROM approvals WHERE id = ${id}`;
      return row(rows);
    },
    async listApprovals(organizationId) {
      const rows = await sql<{ data: Approval }[]>`SELECT data FROM approvals WHERE organization_id = ${organizationId}`;
      return rows.map((item) => item.data);
    },
    async listPendingApprovals(organizationId) {
      const rows = await sql<{ data: Approval }[]>`
        SELECT data FROM approvals WHERE organization_id = ${organizationId} AND status = 'pending'
      `;
      return rows.map((item) => item.data);
    },
    async findApproval(organizationId, targetId, actionType) {
      const rows = await sql<{ data: Approval }[]>`
        SELECT data FROM approvals
        WHERE organization_id = ${organizationId} AND target_id = ${targetId} AND action_type = ${actionType}
        ORDER BY (data->>'createdAt') DESC
        LIMIT 1
      `;
      return row(rows);
    },
    async updateApproval(id, patch) {
      const current = await this.getApproval(id);
      if (!current) throw new Error("Approval not found");
      const next = { ...current, ...patch };
      await sql`UPDATE approvals SET status = ${next.status}, data = ${jsonValue(sql, next)} WHERE id = ${id}`;
      return next;
    },

    async createMediaJob(job) {
      await sql`INSERT INTO media_jobs (id, organization_id, provider_job_id, data) VALUES (${job.id}, ${job.organizationId}, ${job.providerJobId}, ${jsonValue(sql, job)})`;
      return job;
    },
    async getMediaJob(id) {
      const rows = await sql<{ data: MediaJob }[]>`SELECT data FROM media_jobs WHERE id = ${id}`;
      return row(rows);
    },
    async getMediaJobByProviderId(providerJobId) {
      const rows = await sql<{ data: MediaJob }[]>`SELECT data FROM media_jobs WHERE provider_job_id = ${providerJobId} LIMIT 1`;
      return row(rows);
    },
    async listMediaJobs(organizationId) {
      const rows = await sql<{ data: MediaJob }[]>`SELECT data FROM media_jobs WHERE organization_id = ${organizationId}`;
      return rows.map((item) => item.data);
    },
    async updateMediaJob(id, patch) {
      const current = await this.getMediaJob(id);
      if (!current) throw new Error("Media job not found");
      const next = { ...current, ...patch };
      await sql`UPDATE media_jobs SET data = ${jsonValue(sql, next)} WHERE id = ${id}`;
      return next;
    },

    async createAsset(asset) {
      await sql`INSERT INTO assets (id, organization_id, data) VALUES (${asset.id}, ${asset.organizationId}, ${jsonValue(sql, asset)})`;
      return asset;
    },
    async getAsset(id) {
      const rows = await sql<{ data: Asset }[]>`SELECT data FROM assets WHERE id = ${id}`;
      return row(rows);
    },
    async listAssets(organizationId) {
      const rows = await sql<{ data: Asset }[]>`SELECT data FROM assets WHERE organization_id = ${organizationId}`;
      return rows.map((item) => item.data);
    },

    async createCampaign(campaign) {
      await sql`INSERT INTO campaigns (id, organization_id, data) VALUES (${campaign.id}, ${campaign.organizationId}, ${jsonValue(sql, campaign)})`;
      return campaign;
    },
    async getCampaign(id) {
      const rows = await sql<{ data: ContentCampaign }[]>`SELECT data FROM campaigns WHERE id = ${id}`;
      return row(rows);
    },
    async listCampaigns(organizationId) {
      const rows = await sql<{ data: ContentCampaign }[]>`SELECT data FROM campaigns WHERE organization_id = ${organizationId}`;
      return rows.map((item) => item.data);
    },

    async createContentItem(item) {
      await sql`INSERT INTO content_items (id, organization_id, campaign_id, data) VALUES (${item.id}, ${item.organizationId}, ${item.campaignId}, ${jsonValue(sql, item)})`;
      return item;
    },
    async getContentItem(id) {
      const rows = await sql<{ data: ContentItem }[]>`SELECT data FROM content_items WHERE id = ${id}`;
      return row(rows);
    },
    async listContentItems(organizationId) {
      const rows = await sql<{ data: ContentItem }[]>`SELECT data FROM content_items WHERE organization_id = ${organizationId}`;
      return rows.map((item) => item.data);
    },
    async listContentItemsByCampaign(campaignId) {
      const rows = await sql<{ data: ContentItem }[]>`SELECT data FROM content_items WHERE campaign_id = ${campaignId}`;
      return rows.map((item) => item.data);
    },
    async updateContentItem(id, patch) {
      const current = await this.getContentItem(id);
      if (!current) throw new Error("Content item not found");
      const next = { ...current, ...patch };
      await sql`UPDATE content_items SET data = ${jsonValue(sql, next)} WHERE id = ${id}`;
      return next;
    },

    async saveReport(report) {
      await sql`
        INSERT INTO reports (organization_id, data)
        VALUES (${report.organizationId}, ${jsonValue(sql, report)})
        ON CONFLICT (organization_id) DO UPDATE SET data = ${jsonValue(sql, report)}
      `;
      return report;
    },
    async getReport(organizationId) {
      const rows = await sql<{ data: FinalReport }[]>`SELECT data FROM reports WHERE organization_id = ${organizationId}`;
      return row(rows);
    },

    async snapshot(organizationId): Promise<OrganizationSnapshot | undefined> {
      const organization = await this.getOrganization(organizationId);
      if (!organization) return undefined;
      return {
        organization,
        run: await this.getLatestRun(organizationId),
        agents: await this.listAgents(organizationId),
        tasks: await this.listTasks(organizationId),
        events: await this.listEvents(organizationId),
        decisions: await this.listDecisions(organizationId),
        approvals: await this.listApprovals(organizationId),
        campaigns: await this.listCampaigns(organizationId),
        contentItems: await this.listContentItems(organizationId),
        mediaJobs: await this.listMediaJobs(organizationId),
        assets: await this.listAssets(organizationId),
        report: await this.getReport(organizationId),
      };
    },
  };
}

export async function connectPostgres(url: string): Promise<Store> {
  const sql = createSql(url);
  await migratePostgres(sql);
  return createPostgresStore(sql);
}
