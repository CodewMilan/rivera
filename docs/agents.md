# Rivera - AI Organization

## Project overview

Rivera is a multi-agent AI organization that helps a founder turn a product idea into a validated, buildable, and launch-ready plan.

The user provides:

- A high-level product goal
- Target users
- Budget
- Deadline
- Technology constraints

The system then:

1. Understands the goal
2. Creates an organization of specialist agents
3. Assigns tasks
4. Researches the opportunity
5. Checks technical and financial feasibility
6. Debates competing recommendations
7. Makes a strategic decision
8. Creates an MVP plan
9. Generates launch content
10. Evaluates the result
11. Requests human approval for risky actions

The primary hackathon domain is developer-tool product discovery and launch. The demo domain is blockchain developer tooling, especially Stellar and Soroban.

## Core product principle

The product must be outcome-driven, not conversation-driven.

Bad:
- A chatbot that produces generic startup advice
- Agents chatting without producing artifacts
- Fake autonomy with hardcoded text

Good:
- A goal becomes a plan
- A plan becomes tasks
- Tasks use real tools
- Agents produce structured outputs
- Results are evaluated
- The strategy can change when evidence changes
- The user can see what happened

## Agent roles

### CEO / Orchestrator Agent

Responsibilities:

- Parse the user goal
- Create the execution plan
- Create or activate specialist agents
- Assign tasks
- Track dependencies
- Resolve disagreements
- Enforce budgets and permissions
- Decide the next action
- Request human approval when required
- Produce the final recommendation

### Research Agent

Responsibilities:

- Research users and competitors
- Search public web sources
- Inspect developer discussions and GitHub issues
- Extract pain points
- Store evidence and source URLs
- Produce a research report with confidence scores

### Strategy Agent

Responsibilities:

- Compare opportunities
- Select the target user
- Define the product wedge
- Recommend an MVP
- Identify risks
- Explain why the opportunity should or should not be pursued

### Engineering Agent

Responsibilities:

- Create the technical architecture
- Generate repository and API plans
- Produce database schemas
- Create implementation tasks
- Generate starter code
- Define tests
- Estimate engineering effort

### Finance Agent

Responsibilities:

- Estimate development and operating costs
- Track budget usage
- Compare monetization models
- Identify financial risks
- Recommend pricing or business models

### Marketing Agent

Responsibilities:

- Define positioning
- Create product names and messaging
- Generate landing-page copy
- Create launch posts
- Identify distribution channels
- Create a first-user acquisition plan

### Social Media Agent

Responsibilities:

- Convert the approved product strategy into a content campaign
- Generate content ideas for each platform
- Write scripts, captions, hooks, and calls to action
- Create video prompts
- Request image or video generation through the media provider
- Create platform-specific variants
- Prepare content for human review
- Schedule or publish only after explicit approval

### Evaluator Agent

Responsibilities:

- Check whether tasks are complete
- Score output quality
- Verify source quality
- Detect unsupported claims
- Check technical feasibility
- Check budget consistency
- Identify missing work
- Recommend retry, revision, escalation, or completion

## Execution states

Use a controlled state machine:

```text
INTAKE
  -> PLANNING
  -> RESEARCH
  -> FEASIBILITY
  -> DEBATE
  -> DECISION
  -> BUILD_PLAN
  -> CONTENT_PLAN
  -> REVIEW
  -> APPROVAL
  -> COMPLETE
```

Allowed transitions must be explicit. Do not let agents run an unlimited conversation loop.

## Agent output requirements

Every agent must return structured JSON matching a defined schema.

Each result should include:

- agentType
- taskId
- status
- summary
- findings
- evidence
- risks
- recommendation
- confidence
- nextAction
- artifacts
- estimatedCost
- durationMs

Do not rely only on free-form text.

## Safety and permissions

Agents must not perform irreversible external actions without user approval.

Approval is required before:

- Publishing social media posts
- Scheduling posts
- Sending emails
- Spending money
- Deploying to production
- Deleting data
- Modifying production resources
- Creating paid campaigns

Drafting is allowed without approval. Publishing is not.

## Coding rules

- Use TypeScript.
- Use strict TypeScript configuration.
- Prefer small, testable modules.
- Keep provider-specific integrations behind interfaces.
- Never expose API keys to the client.
- Store secrets only in server-side environment variables.
- Validate all external responses.
- Add loading, error, empty, and retry states.
- Do not hardcode fake agent results in production code.
- Demo fixtures may exist, but must be clearly isolated.
- Use deterministic demo mode if external APIs fail.
- Add an audit event for every important action.
- Keep the UI polished and easy to understand.

## Provider abstraction rules

External providers must not be directly embedded throughout the app.

Create interfaces such as:

```ts
interface ResearchProvider {
  search(query: string): Promise<SearchResult[]>;
}

interface MediaProvider {
  generateVideo(input: VideoGenerationInput): Promise<MediaJob>;
  getJobStatus(jobId: string): Promise<MediaJob>;
}

interface SocialPublisher {
  createDraft(input: SocialDraftInput): Promise<SocialDraft>;
  publish(input: SocialPublishInput): Promise<PublishedPost>;
}
```

This allows Higgsfield or another provider to be replaced without rewriting the application.

## Definition of done

A feature is complete only when:

- The happy path works
- Loading states exist
- Errors are handled
- The result is persisted
- The action appears in the activity timeline
- The relevant API route is tested
- The user can understand the result
- Risky actions require approval