export type OrganizationStatus = "active" | "paused" | "completed" | "failed";

export type RunStatus =
  | "intake"
  | "planning"
  | "research"
  | "feasibility"
  | "debate"
  | "decision"
  | "build_plan"
  | "content_plan"
  | "media_generation"
  | "review"
  | "approval"
  | "scheduled"
  | "published"
  | "evaluation"
  | "complete"
  | "failed"
  | "cancelled";

export type AgentType =
  | "ceo"
  | "research"
  | "strategy"
  | "engineering"
  | "finance"
  | "marketing"
  | "social_media"
  | "hiring"
  | "competitor"
  | "evaluator";

export type AgentStatus = "idle" | "working" | "blocked" | "review" | "failed";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "review"
  | "approval_required"
  | "done"
  | "failed";

export type DecisionStatus = "open" | "approved" | "rejected" | "implemented";

export type ApprovalActionType =
  | "publish_social_post"
  | "schedule_social_post"
  | "spend_budget"
  | "deploy_production"
  | "send_external_message";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export type MediaJobStatus = "queued" | "processing" | "completed" | "failed";

export type ContentPlatform = "x" | "linkedin" | "instagram" | "tiktok";

export type ContentType = "text" | "video" | "carousel" | "image";

export type ContentStatus =
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

export type AgentOutputStatus = "success" | "needs_review" | "blocked" | "failed";

export type Organization = {
  id: string;
  name: string;
  goal: string;
  domain: string;
  targetUser: string;
  technology: string;
  preferredChannels: ContentPlatform[];
  hiringRoles: string[];
  autoPublish: boolean;
  budgetCents: number;
  budgetUsedCents: number;
  deadline: string;
  status: OrganizationStatus;
  createdAt: string;
};

export type Agent = {
  id: string;
  organizationId: string;
  type: AgentType;
  name: string;
  objective: string;
  tools: string[];
  permissions: string[];
  budgetCents: number;
  spentCents: number;
  status: AgentStatus;
  currentTaskId?: string;
  confidence?: number;
  lastAction?: string;
};

export type Evaluation = {
  score: number;
  notes: string;
  complete: boolean;
  retryRecommended: boolean;
};

export type Task = {
  id: string;
  organizationId: string;
  runId: string;
  agentId: string;
  parentTaskId?: string;
  title: string;
  description: string;
  dependencies: string[];
  status: TaskStatus;
  input: unknown;
  output?: unknown;
  evaluation?: Evaluation;
  estimatedCostCents?: number;
  actualCostCents?: number;
  createdAt: string;
  updatedAt: string;
};

export type RunCaps = {
  maxSteps: number;
  maxCostCents: number;
  maxDurationMs: number;
  maxRetries: number;
};

export type Run = {
  id: string;
  organizationId: string;
  status: RunStatus;
  stepCount: number;
  costCents: number;
  startedAt: string;
  updatedAt: string;
  cancelled: boolean;
  error?: string;
  demoMode: boolean;
  caps: RunCaps;
};

export type EventRecord = {
  id: string;
  organizationId: string;
  runId?: string;
  type: string;
  summary: string;
  payload: unknown;
  createdAt: string;
};

export type Proposal = {
  id: string;
  agentType: AgentType;
  recommendation: string;
  evidence: unknown[];
  risks: unknown[];
};

export type Decision = {
  id: string;
  organizationId: string;
  runId: string;
  question: string;
  proposals: Proposal[];
  selectedProposalId?: string;
  rationale?: string;
  confidence?: number;
  status: DecisionStatus;
  createdAt: string;
};

export type Approval = {
  id: string;
  organizationId: string;
  runId?: string;
  actionType: ApprovalActionType;
  targetId: string;
  summary: string;
  payload: unknown;
  status: ApprovalStatus;
  createdAt: string;
  decidedAt?: string;
  expiresAt?: string;
};

export type MediaJob = {
  id: string;
  organizationId: string;
  contentItemId?: string;
  provider: "higgsfield";
  providerJobId: string;
  type: "image" | "video" | "edit";
  prompt: string;
  inputAssetIds: string[];
  status: MediaJobStatus;
  outputAssetId?: string;
  outputUrl?: string;
  previewUrl?: string;
  estimatedCostCents?: number;
  actualCostCents?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type Asset = {
  id: string;
  organizationId: string;
  url: string;
  previewUrl?: string;
  kind: "image" | "video";
  provider: string;
  createdAt: string;
};

export type ContentCampaign = {
  id: string;
  organizationId: string;
  runId: string;
  title: string;
  pillars: string[];
  createdAt: string;
};

export type ContentItem = {
  id: string;
  campaignId: string;
  organizationId: string;
  platform: ContentPlatform;
  type: ContentType;
  title: string;
  hook: string;
  script?: string;
  caption: string;
  callToAction?: string;
  hashtags: string[];
  claimsUsed: string[];
  mediaAssetIds: string[];
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  demoPublished?: boolean;
  estimatedCostCents?: number;
};

export type AgentOutput = {
  agentType?: AgentType;
  taskId?: string;
  status: AgentOutputStatus;
  summary: string;
  findings: unknown[];
  evidence: unknown[];
  risks: unknown[];
  recommendation?: string;
  confidence: number;
  artifacts: string[];
  nextAction?: string;
  estimatedCostCents: number;
  durationMs?: number;
};

export type FinalReport = {
  organizationId: string;
  runId: string;
  opportunityScore: number;
  problemStrength: number;
  evidenceQuality: number;
  technicalFeasibility: number;
  budgetFit: number;
  distributionPotential: number;
  mainRisks: string[];
  recommendedNextSteps: string[];
  artifacts: string[];
};

export type OrganizationSnapshot = {
  organization: Organization;
  run?: Run;
  agents: Agent[];
  tasks: Task[];
  events: EventRecord[];
  decisions: Decision[];
  approvals: Approval[];
  campaigns: ContentCampaign[];
  contentItems: ContentItem[];
  mediaJobs: MediaJob[];
  assets: Asset[];
  report?: FinalReport;
};
