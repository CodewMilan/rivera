# Rivera - Architecture

## Architecture goals

The system must be:

- Modular
- Observable
- Provider-independent
- Safe for external actions
- Easy to demo
- Easy to test
- Resistant to infinite agent loops
- Able to recover from provider failures

## High-level architecture

```text
┌─────────────────────────────────────────────┐
│                    User                     │
│  Goal input, review, approval, intervention  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             Next.js Web Dashboard           │
│                                             │
│ Goal | Agents | Tasks | Debate | Content     │
│ Timeline | Media Review | Final Report       │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                Application API              │
│                                             │
│ Goals | Runs | Agents | Tasks | Approvals    │
│ Content | Media | Publishing | Evaluations   │
└───────┬──────────────┬──────────────┬────────┘
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Orchestrator │ │ Task Engine  │ │ Approval     │
│              │ │              │ │ Engine       │
│ Plans and    │ │ Dependencies │ │ Human gates  │
│ coordinates  │ │ Retries      │ │ Risk checks  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
┌─────────────────────────────────────────────┐
│              Specialist Agents              │
│                                             │
│ Research | Strategy | Engineering           │
│ Finance | Marketing | Social Media          │
│ Evaluator                                  │
└───────────────┬───────────────┬─────────────┘
                │               │
                ▼               ▼
┌────────────────────────┐ ┌──────────────────┐
│ Tool Adapter Layer     │ │ Provider Layer   │
│                        │ │                  │
│ Web Search             │ │ LLM Provider     │
│ GitHub                 │ │ Higgsfield      │
│ Code Execution         │ │ Social Publisher │
│ File Generation        │ │ Storage          │
│ Calculator             │ │                  │
└──────────────┬─────────┘ └────────┬─────────┘
               │                    │
               ▼                    ▼
┌─────────────────────────────────────────────┐
│                 Data Layer                  │
│                                             │
│ PostgreSQL / Supabase                       │
│ Object storage for videos and images        │
│ Vector memory                                │
│ Event log                                    │
│ Provider job records                         │
└─────────────────────────────────────────────┘
```

## State machine

```text
INTAKE
  -> PLANNING
  -> RESEARCH
  -> FEASIBILITY
  -> DEBATE
  -> DECISION
  -> BUILD_PLAN
  -> CONTENT_PLAN
  -> MEDIA_GENERATION
  -> REVIEW
  -> APPROVAL
  -> SCHEDULED
  -> PUBLISHED
  -> EVALUATION
  -> COMPLETE
```

Some workflows stop before publication:

```text
CONTENT_PLAN
  -> REVIEW
  -> COMPLETE
```

This is useful when the user only wants drafts.

## Core entities

### Organization

```ts
type Organization = {
  id: string;
  name: string;
  goal: string;
  domain: string;
  budgetCents: number;
  budgetUsedCents: number;
  deadline: string;
  status: "active" | "paused" | "completed" | "failed";
};
```

### Agent

```ts
type Agent = {
  id: string;
  organizationId: string;
  type:
    | "ceo"
    | "research"
    | "strategy"
    | "engineering"
    | "finance"
    | "marketing"
    | "social_media"
    | "evaluator";
  name: string;
  objective: string;
  tools: string[];
  permissions: string[];
  budgetCents: number;
  spentCents: number;
  status: "idle" | "working" | "blocked" | "review" | "failed";
};
```

### Task

```ts
type Task = {
  id: string;
  organizationId: string;
  agentId: string;
  parentTaskId?: string;
  title: string;
  description: string;
  dependencies: string[];
  status:
    | "todo"
    | "in_progress"
    | "blocked"
    | "review"
    | "approval_required"
    | "done"
    | "failed";
  input: unknown;
  output?: unknown;
  evaluation?: Evaluation;
  estimatedCostCents?: number;
  actualCostCents?: number;
};
```

### Decision

```ts
type Decision = {
  id: string;
  organizationId: string;
  question: string;
  proposals: Proposal[];
  selectedProposalId?: string;
  rationale?: string;
  confidence?: number;
  status: "open" | "approved" | "rejected" | "implemented";
};
```

### Media job

```ts
type MediaJob = {
  id: string;
  organizationId: string;
  contentItemId?: string;
  provider: "higgsfield";
  providerJobId: string;
  type: "image" | "video" | "edit";
  prompt: string;
  inputAssetIds: string[];
  status: "queued" | "processing" | "completed" | "failed";
  outputAssetId?: string;
  estimatedCostCents?: number;
  actualCostCents?: number;
  error?: string;
};
```

### Approval

```ts
type Approval = {
  id: string;
  organizationId: string;
  actionType:
    | "publish_social_post"
    | "schedule_social_post"
    | "spend_budget"
    | "deploy_production"
    | "send_external_message";
  targetId: string;
  summary: string;
  payload: unknown;
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
  decidedAt?: string;
};
```

## Orchestrator loop

```ts
async function runOrganization(runId: string) {
  const run = await loadRun(runId);

  while (!isTerminal(run.status)) {
    const nextStep = await determineNextStep(run);

    if (nextStep.requiresApproval) {
      await createApproval(nextStep);
      return;
    }

    const result = await executeStep(nextStep);
    await persistResult(result);
    await appendEvent(result);
    await evaluateStep(result);

    run.status = await determineRunStatus(run);
    await saveRun(run);
  }
}
```

The loop must have:

- Maximum step count
- Maximum cost
- Maximum duration
- Retry limits
- Cancellation support
- Failure recovery
- Human approval checks

## Agent execution contract

```ts
interface AgentInput {
  organizationId: string;
  taskId: string;
  goal: string;
  context: unknown;
  availableTools: string[];
  constraints: unknown;
}

interface AgentOutput {
  status: "success" | "needs_review" | "blocked" | "failed";
  summary: string;
  findings: unknown[];
  evidence: unknown[];
  risks: unknown[];
  recommendation?: string;
  confidence: number;
  artifacts: string[];
  nextAction?: string;
  estimatedCostCents: number;
}
```

## Tool adapter contract

```ts
interface ToolAdapter<TInput, TResult> {
  name: string;
  description: string;
  requiresApproval?: boolean;
  execute(input: TInput): Promise<TResult>;
}
```

Examples:

```ts
webSearchTool
githubTool
codeExecutionTool
fileGenerationTool
higgsfieldVideoTool
socialDraftTool
socialPublishTool
```

## Higgsfield integration

Use Higgsfield behind a provider adapter.

```ts
interface MediaProvider {
  createVideo(input: VideoInput): Promise<MediaJob>;
  createImage(input: ImageInput): Promise<MediaJob>;
  editVideo(input: VideoEditInput): Promise<MediaJob>;
  getStatus(providerJobId: string): Promise<MediaStatus>;
  cancel(providerJobId: string): Promise<void>;
}
```

The application should:

1. Create a local media job.
2. Submit the request to Higgsfield.
3. Store the external provider job ID.
4. Poll the job or receive a webhook.
5. Store the output in object storage.
6. Create a preview.
7. Attach the asset to the content item.
8. Send the content item to human review.

Do not assume video generation is synchronous.

API secrets must only be used server-side:

```env
HIGGSFIELD_API_KEY_ID=
HIGGSFIELD_API_KEY_SECRET=
HIGGSFIELD_WEBHOOK_SECRET=
```

## Social publisher integration

Use a separate adapter:

```ts
interface SocialPublisher {
  createDraft(input: SocialDraftInput): Promise<SocialDraft>;
  schedule(input: SocialScheduleInput): Promise<ScheduledPost>;
  publish(input: SocialPublishInput): Promise<PublishedPost>;
}
```

Every publishing call must pass through the approval engine.

The first version may:

- Generate platform-ready content
- Store drafts
- Show previews
- Simulate publishing in demo mode
- Publish to one real platform after approval

Do not make fake successful publishing appear real. Clearly label demo mode.

## Webhook flow

```text
Higgsfield
   │
   ▼
POST /api/webhooks/higgsfield
   │
   ├── Verify webhook signature
   ├── Find local media job
   ├── Update status
   ├── Save output asset
   ├── Append event
   └── Notify dashboard
```

If webhooks are unavailable, use polling with exponential backoff.

## Recommended API routes

```text
POST   /api/organizations
GET    /api/organizations/:id
POST   /api/organizations/:id/runs
GET    /api/runs/:id
GET    /api/runs/:id/events
GET    /api/organizations/:id/agents
GET    /api/organizations/:id/tasks
POST   /api/tasks/:id/retry
POST   /api/decisions/:id/approve
POST   /api/decisions/:id/reject

POST   /api/content/campaigns
GET    /api/content/campaigns/:id
POST   /api/content/items
PATCH  /api/content/items/:id
POST   /api/content/items/:id/generate-media
POST   /api/content/items/:id/approve
POST   /api/content/items/:id/reject
POST   /api/content/items/:id/schedule
POST   /api/content/items/:id/publish

POST   /api/webhooks/higgsfield
```

## Project structure

```text
src/
├── app/
│   ├── dashboard/
│   ├── organizations/
│   ├── agents/
│   ├── tasks/
│   ├── decisions/
│   ├── content/
│   └── api/
├── components/
│   ├── organization/
│   ├── agents/
│   ├── tasks/
│   ├── decisions/
│   ├── content/
│   └── media/
├── lib/
│   ├── orchestration/
│   ├── agents/
│   ├── tools/
│   ├── providers/
│   │   ├── higgsfield/
│   │   └── social/
│   ├── approvals/
│   ├── memory/
│   ├── evaluation/
│   ├── events/
│   └── database/
├── types/
└── tests/
```

## Failure handling

Every external call must handle:

- Timeout
- Invalid response
- Authentication failure
- Rate limit
- Insufficient provider credits
- Provider job failure
- Missing output URL
- Webhook duplication
- User cancellation

Use idempotency keys for media generation and publishing.

## Demo mode

Demo mode must use the same interfaces as production.

It may provide:

- Cached research results
- Cached media output
- Deterministic agent responses
- Simulated publishing
- Fixed provider failure scenarios

The UI must label simulated actions clearly.

Example:

```text
Demo mode: Publishing simulated
```

## Security

- Never expose provider secrets in frontend code.
- Validate webhook signatures.
- Sanitize generated captions before rendering.
- Restrict file upload types and sizes.
- Limit agent tool permissions.
- Log all external actions.
- Require explicit approval for publishing and spending.
- Add cost ceilings to every media-generation job.