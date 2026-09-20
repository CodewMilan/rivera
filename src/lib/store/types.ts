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
  GmailStatus,
  InboxMessage,
  MediaJob,
  Organization,
  OrganizationSnapshot,
  Run,
  Task,
} from "@/types";

export interface Store {
  createOrganization(org: Organization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  updateOrganization(id: string, patch: Partial<Organization>): Promise<Organization>;
  listOrganizations(): Promise<Organization[]>;

  createRun(run: Run): Promise<Run>;
  getRun(id: string): Promise<Run | undefined>;
  getLatestRun(organizationId: string): Promise<Run | undefined>;
  updateRun(id: string, patch: Partial<Run>): Promise<Run>;

  createAgent(agent: Agent): Promise<Agent>;
  getAgent(id: string): Promise<Agent | undefined>;
  listAgents(organizationId: string): Promise<Agent[]>;
  updateAgent(id: string, patch: Partial<Agent>): Promise<Agent>;

  createTask(task: Task): Promise<Task>;
  getTask(id: string): Promise<Task | undefined>;
  listTasks(organizationId: string): Promise<Task[]>;
  listTasksByRun(runId: string): Promise<Task[]>;
  updateTask(id: string, patch: Partial<Task>): Promise<Task>;

  appendEvent(event: EventRecord): Promise<EventRecord>;
  listEvents(organizationId: string): Promise<EventRecord[]>;
  listEventsByRun(runId: string): Promise<EventRecord[]>;

  createDecision(decision: Decision): Promise<Decision>;
  getDecision(id: string): Promise<Decision | undefined>;
  listDecisions(organizationId: string): Promise<Decision[]>;
  updateDecision(id: string, patch: Partial<Decision>): Promise<Decision>;

  createApproval(approval: Approval): Promise<Approval>;
  getApproval(id: string): Promise<Approval | undefined>;
  listApprovals(organizationId: string): Promise<Approval[]>;
  listPendingApprovals(organizationId: string): Promise<Approval[]>;
  findApproval(organizationId: string, targetId: string, actionType: string): Promise<Approval | undefined>;
  updateApproval(id: string, patch: Partial<Approval>): Promise<Approval>;

  createMediaJob(job: MediaJob): Promise<MediaJob>;
  getMediaJob(id: string): Promise<MediaJob | undefined>;
  getMediaJobByProviderId(providerJobId: string): Promise<MediaJob | undefined>;
  listMediaJobs(organizationId: string): Promise<MediaJob[]>;
  updateMediaJob(id: string, patch: Partial<MediaJob>): Promise<MediaJob>;

  createAsset(asset: Asset): Promise<Asset>;
  getAsset(id: string): Promise<Asset | undefined>;
  listAssets(organizationId: string): Promise<Asset[]>;

  createCampaign(campaign: ContentCampaign): Promise<ContentCampaign>;
  getCampaign(id: string): Promise<ContentCampaign | undefined>;
  listCampaigns(organizationId: string): Promise<ContentCampaign[]>;

  createContentItem(item: ContentItem): Promise<ContentItem>;
  getContentItem(id: string): Promise<ContentItem | undefined>;
  listContentItems(organizationId: string): Promise<ContentItem[]>;
  listContentItemsByCampaign(campaignId: string): Promise<ContentItem[]>;
  updateContentItem(id: string, patch: Partial<ContentItem>): Promise<ContentItem>;

  saveReport(report: FinalReport): Promise<FinalReport>;
  getReport(organizationId: string): Promise<FinalReport | undefined>;

  upsertGmailConnection(connection: GmailConnection): Promise<GmailConnection>;
  getGmailConnection(organizationId: string): Promise<GmailConnection | undefined>;
  deleteGmailConnection(organizationId: string): Promise<void>;
  getGmailStatus(organizationId: string): Promise<GmailStatus>;

  upsertInboxMessage(message: InboxMessage): Promise<InboxMessage>;
  listInboxMessages(organizationId: string): Promise<InboxMessage[]>;
  deleteInboxMessages(organizationId: string): Promise<void>;

  snapshot(organizationId: string): Promise<OrganizationSnapshot | undefined>;
}
