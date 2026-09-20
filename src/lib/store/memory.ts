import type {
  Agent,
  Approval,
  Asset,
  ContentCampaign,
  ContentItem,
  Decision,
  EventRecord,
  FinalReport,
  GmailConnection,
  InboxMessage,
  MediaJob,
  Organization,
  OrganizationSnapshot,
  Run,
  Task,
} from "@/types";
import type { Store } from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requireEntity<T>(value: T | undefined, label: string): T {
  if (!value) throw new Error(`${label} not found`);
  return value;
}

export function createMemoryStore(): Store {
  const organizations = new Map<string, Organization>();
  const runs = new Map<string, Run>();
  const agents = new Map<string, Agent>();
  const tasks = new Map<string, Task>();
  const events = new Map<string, EventRecord>();
  const decisions = new Map<string, Decision>();
  const approvals = new Map<string, Approval>();
  const mediaJobs = new Map<string, MediaJob>();
  const assets = new Map<string, Asset>();
  const campaigns = new Map<string, ContentCampaign>();
  const contentItems = new Map<string, ContentItem>();
  const reports = new Map<string, FinalReport>();
  const gmailConnections = new Map<string, GmailConnection>();
  const inboxMessages = new Map<string, InboxMessage>();

  return {
    async createOrganization(org) {
      organizations.set(org.id, clone(org));
      return clone(org);
    },
    async getOrganization(id) {
      const org = organizations.get(id);
      return org ? clone(org) : undefined;
    },
    async updateOrganization(id, patch) {
      const current = requireEntity(organizations.get(id), "Organization");
      const next = { ...current, ...patch };
      organizations.set(id, next);
      return clone(next);
    },
    async listOrganizations() {
      return [...organizations.values()].map(clone);
    },

    async createRun(run) {
      runs.set(run.id, clone(run));
      return clone(run);
    },
    async getRun(id) {
      const run = runs.get(id);
      return run ? clone(run) : undefined;
    },
    async getLatestRun(organizationId) {
      const matches = await this.listRuns(organizationId);
      return matches[0];
    },
    async listRuns(organizationId) {
      return [...runs.values()]
        .filter((run) => run.organizationId === organizationId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map(clone);
    },
    async updateRun(id, patch) {
      const current = requireEntity(runs.get(id), "Run");
      const next = { ...current, ...patch };
      runs.set(id, next);
      return clone(next);
    },

    async createAgent(agent) {
      agents.set(agent.id, clone(agent));
      return clone(agent);
    },
    async getAgent(id) {
      const agent = agents.get(id);
      return agent ? clone(agent) : undefined;
    },
    async listAgents(organizationId) {
      return [...agents.values()]
        .filter((agent) => agent.organizationId === organizationId)
        .map(clone);
    },
    async updateAgent(id, patch) {
      const current = requireEntity(agents.get(id), "Agent");
      const next = { ...current, ...patch };
      agents.set(id, next);
      return clone(next);
    },

    async createTask(task) {
      tasks.set(task.id, clone(task));
      return clone(task);
    },
    async getTask(id) {
      const task = tasks.get(id);
      return task ? clone(task) : undefined;
    },
    async listTasks(organizationId) {
      return [...tasks.values()]
        .filter((task) => task.organizationId === organizationId)
        .map(clone);
    },
    async listTasksByRun(runId) {
      return [...tasks.values()].filter((task) => task.runId === runId).map(clone);
    },
    async updateTask(id, patch) {
      const current = requireEntity(tasks.get(id), "Task");
      const next = { ...current, ...patch, updatedAt: patch.updatedAt ?? current.updatedAt };
      tasks.set(id, next);
      return clone(next);
    },

    async appendEvent(event) {
      events.set(event.id, clone(event));
      return clone(event);
    },
    async listEvents(organizationId) {
      return [...events.values()]
        .filter((event) => event.organizationId === organizationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(clone);
    },
    async listEventsByRun(runId) {
      return [...events.values()]
        .filter((event) => event.runId === runId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(clone);
    },

    async createDecision(decision) {
      decisions.set(decision.id, clone(decision));
      return clone(decision);
    },
    async getDecision(id) {
      const decision = decisions.get(id);
      return decision ? clone(decision) : undefined;
    },
    async listDecisions(organizationId) {
      return [...decisions.values()]
        .filter((decision) => decision.organizationId === organizationId)
        .map(clone);
    },
    async updateDecision(id, patch) {
      const current = requireEntity(decisions.get(id), "Decision");
      const next = { ...current, ...patch };
      decisions.set(id, next);
      return clone(next);
    },

    async createApproval(approval) {
      approvals.set(approval.id, clone(approval));
      return clone(approval);
    },
    async getApproval(id) {
      const approval = approvals.get(id);
      return approval ? clone(approval) : undefined;
    },
    async listApprovals(organizationId) {
      return [...approvals.values()]
        .filter((approval) => approval.organizationId === organizationId)
        .map(clone);
    },
    async listPendingApprovals(organizationId) {
      return [...approvals.values()]
        .filter(
          (approval) =>
            approval.organizationId === organizationId && approval.status === "pending",
        )
        .map(clone);
    },
    async findApproval(organizationId, targetId, actionType) {
      const match = [...approvals.values()].find(
        (approval) =>
          approval.organizationId === organizationId &&
          approval.targetId === targetId &&
          approval.actionType === actionType,
      );
      return match ? clone(match) : undefined;
    },
    async updateApproval(id, patch) {
      const current = requireEntity(approvals.get(id), "Approval");
      const next = { ...current, ...patch };
      approvals.set(id, next);
      return clone(next);
    },

    async createMediaJob(job) {
      mediaJobs.set(job.id, clone(job));
      return clone(job);
    },
    async getMediaJob(id) {
      const job = mediaJobs.get(id);
      return job ? clone(job) : undefined;
    },
    async getMediaJobByProviderId(providerJobId) {
      const job = [...mediaJobs.values()].find((item) => item.providerJobId === providerJobId);
      return job ? clone(job) : undefined;
    },
    async listMediaJobs(organizationId) {
      return [...mediaJobs.values()]
        .filter((job) => job.organizationId === organizationId)
        .map(clone);
    },
    async updateMediaJob(id, patch) {
      const current = requireEntity(mediaJobs.get(id), "MediaJob");
      const next = { ...current, ...patch };
      mediaJobs.set(id, next);
      return clone(next);
    },

    async createAsset(asset) {
      assets.set(asset.id, clone(asset));
      return clone(asset);
    },
    async getAsset(id) {
      const asset = assets.get(id);
      return asset ? clone(asset) : undefined;
    },
    async listAssets(organizationId) {
      return [...assets.values()]
        .filter((asset) => asset.organizationId === organizationId)
        .map(clone);
    },

    async createCampaign(campaign) {
      campaigns.set(campaign.id, clone(campaign));
      return clone(campaign);
    },
    async getCampaign(id) {
      const campaign = campaigns.get(id);
      return campaign ? clone(campaign) : undefined;
    },
    async listCampaigns(organizationId) {
      return [...campaigns.values()]
        .filter((campaign) => campaign.organizationId === organizationId)
        .map(clone);
    },

    async createContentItem(item) {
      contentItems.set(item.id, clone(item));
      return clone(item);
    },
    async getContentItem(id) {
      const item = contentItems.get(id);
      return item ? clone(item) : undefined;
    },
    async listContentItems(organizationId) {
      return [...contentItems.values()]
        .filter((item) => item.organizationId === organizationId)
        .map(clone);
    },
    async listContentItemsByCampaign(campaignId) {
      return [...contentItems.values()]
        .filter((item) => item.campaignId === campaignId)
        .map(clone);
    },
    async updateContentItem(id, patch) {
      const current = requireEntity(contentItems.get(id), "Content item");
      const next = { ...current, ...patch };
      contentItems.set(id, next);
      return clone(next);
    },

    async saveReport(report) {
      reports.set(report.organizationId, clone(report));
      return clone(report);
    },
    async getReport(organizationId) {
      const report = reports.get(organizationId);
      return report ? clone(report) : undefined;
    },

    async upsertGmailConnection(connection) {
      gmailConnections.set(connection.organizationId, clone(connection));
      return clone(connection);
    },
    async getGmailConnection(organizationId) {
      const connection = gmailConnections.get(organizationId);
      return connection ? clone(connection) : undefined;
    },
    async deleteGmailConnection(organizationId) {
      gmailConnections.delete(organizationId);
    },
    async getGmailStatus(organizationId) {
      const connection = gmailConnections.get(organizationId);
      return {
        configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        connected: Boolean(connection),
        email: connection?.email,
        lastSyncedAt: connection?.lastSyncedAt,
      };
    },

    async upsertInboxMessage(message) {
      const existing = [...inboxMessages.values()].find(
        (item) => item.organizationId === message.organizationId && item.gmailId === message.gmailId,
      );
      const next = existing ? { ...existing, ...message, id: existing.id } : clone(message);
      inboxMessages.set(next.id, next);
      return clone(next);
    },
    async listInboxMessages(organizationId) {
      return [...inboxMessages.values()]
        .filter((item) => item.organizationId === organizationId)
        .sort((a, b) => b.relevanceScore - a.relevanceScore || b.receivedAt.localeCompare(a.receivedAt))
        .map(clone);
    },
    async deleteInboxMessages(organizationId) {
      for (const [id, item] of inboxMessages) {
        if (item.organizationId === organizationId) inboxMessages.delete(id);
      }
    },

    async snapshot(organizationId): Promise<OrganizationSnapshot | undefined> {
      const organization = organizations.get(organizationId);
      if (!organization) return undefined;
      const run = [...runs.values()]
        .filter((item) => item.organizationId === organizationId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
      return {
        organization: clone(organization),
        run: run ? clone(run) : undefined,
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
        gmail: await this.getGmailStatus(organizationId),
        inboxMessages: await this.listInboxMessages(organizationId),
      };
    },
  };
}
