# Rivera - Product Specification

## Product statement

Rivera is an AI product-launch organization.

It takes a high-level idea and coordinates specialist agents to research, evaluate, plan, build, and prepare the idea for launch.

## Primary user

The primary user is a technical founder or developer who has an idea but needs help with:

- Market research
- Product strategy
- Technical planning
- Financial feasibility
- Launch preparation
- Social content creation

## Hackathon demo goal

The demo user enters:

> Build a developer tool that helps Stellar developers debug Soroban transactions in 30 days with a $500 budget.

The system should produce:

- Evidence-backed research
- A product recommendation
- A technical MVP plan
- A cost analysis
- Launch messaging
- A social-media campaign
- A final feasibility score
- A human approval request for publishing

## Main screens

### 1. Organization dashboard

Show:

- Original goal
- Current phase
- Overall progress
- Budget used and remaining
- Active agents
- Blocked tasks
- Decisions awaiting approval
- Recent activity
- Current recommendation

### 2. Agent organization view

Show cards for:

- CEO / Orchestrator
- Research
- Strategy
- Engineering
- Finance
- Marketing
- Social Media
- Evaluator

Each card shows:

- Role
- Current status
- Current task
- Progress
- Confidence
- Budget usage
- Last completed action

### 3. Goal intake screen

Fields:

- Goal
- Target user
- Deadline
- Budget
- Technology constraints
- Preferred channels
- Approval settings

Example:

```text
Goal:
Build a developer tool for Stellar developers.

Target users:
Soroban developers.

Deadline:
30 days.

Budget:
500 USD.

Technology:
TypeScript, Next.js, Stellar SDK.
```

### 4. Task board

Each task includes:

- Title
- Description
- Assigned agent
- Status
- Dependencies
- Priority
- Expected output
- Actual output
- Cost
- Duration
- Evaluation score

Statuses:

```text
TODO
IN_PROGRESS
BLOCKED
REVIEW
APPROVAL_REQUIRED
DONE
FAILED
```

### 5. Agent activity timeline

Display events such as:

- Agent created
- Task assigned
- Tool called
- Research completed
- Agent disagreement
- Decision made
- Artifact generated
- Task failed
- Retry started
- Approval requested
- Approval granted
- Content scheduled
- Content published

### 6. Debate and decisions screen

Show:

- Decision question
- Agent recommendations
- Supporting evidence
- Risks
- Disagreements
- CEO decision
- Confidence
- Decision status
- Revisit date

Example:

```text
Question:
Should the MVP be a CLI or hosted dashboard?

Engineering:
CLI is faster to build.

Finance:
Hosted infrastructure increases costs.

Marketing:
Hosted dashboard is easier to demonstrate.

CEO decision:
Build the CLI first and position the hosted dashboard as a paid upgrade.
```

### 7. Final report screen

Show:

- Opportunity score
- Problem strength
- Evidence quality
- Technical feasibility
- Budget fit
- Distribution potential
- Main risks
- Recommended next steps
- Generated artifacts

## Social media pipeline

The social media pipeline is part of the product-launch workflow.

It should transform the approved product strategy into platform-specific content.

### Pipeline

```text
Product strategy
  -> Content strategy
  -> Content calendar
  -> Post ideas
  -> Scripts and captions
  -> Visual concepts
  -> Media generation
  -> Video editing
  -> Platform variants
  -> Human review
  -> Scheduling
  -> Publishing
  -> Performance tracking
```

### Social Media Agent responsibilities

The Social Media Agent receives:

- Product description
- Target user
- Product benefits
- Launch date
- Brand tone
- Approved claims
- Preferred platforms
- Available media budget

It creates:

- Content pillars
- Content ideas
- Hooks
- Short-video scripts
- Captions
- Calls to action
- Hashtags
- Thumbnail concepts
- Video-generation prompts
- Platform-specific variants

### Initial supported platforms

For the hackathon, support content generation for:

- X
- LinkedIn
- Instagram Reels
- TikTok

Publishing may be limited to one platform or mocked with a real approval workflow if platform credentials are unavailable.

### Content types

Support:

- Text post
- Short video
- Product demo
- Founder announcement
- Educational explainer
- Customer problem story
- Feature announcement
- Launch countdown
- Screenshot carousel

### Content object

```ts
type ContentItem = {
  id: string;
  campaignId: string;
  platform: "x" | "linkedin" | "instagram" | "tiktok";
  type: "text" | "video" | "carousel" | "image";
  title: string;
  hook: string;
  script?: string;
  caption: string;
  callToAction?: string;
  hashtags: string[];
  mediaAssetIds: string[];
  status: "draft" | "review" | "approved" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  publishedAt?: string;
};
```

## Media generation flow

The user or Social Media Agent submits:

- Prompt
- Reference image or product screenshot
- Video duration
- Aspect ratio
- Style
- Brand requirements
- Target platform

The media provider returns:

- Job ID
- Status
- Output URL
- Preview image
- Cost
- Provider metadata

Generation must be asynchronous.

```text
Create media job
  -> Save provider job ID
  -> Poll or receive webhook
  -> Save completed asset
  -> Create preview
  -> Send to review
```

Higgsfield offers an API for video and image generation from code, with multiple models available behind one API and prepaid usage. Its video tools support generation and editing workflows such as captions, reframing, transitions, branding, and audio cleanup. [92][94]

## Approval workflow

The system must show a review screen before publication.

Review screen includes:

- Platform
- Video or image preview
- Caption
- Hashtags
- Scheduled time
- Estimated cost
- Generated media provider
- Claims used
- Required approval

Actions:

```text
Edit
Approve
Reject
Regenerate
Schedule
Publish now
```

No post may be published automatically unless the user explicitly enables auto-publishing.

## Evaluation metrics

### Product workflow

- Plan completion rate
- Task completion rate
- Tool success rate
- Time to final recommendation
- Total model and provider cost
- Evaluation score
- Number of human interventions

### Social pipeline

- Content items generated
- Media generation success rate
- Average generation cost
- Review approval rate
- Publishing success rate
- Platform formatting errors
- Time from strategy to approved content

## Non-goals

Do not build:

- A general-purpose social-media management suite
- Full multi-platform analytics
- Autonomous ad spending
- Autonomous influencer outreach
- Unlimited video generation
- A public agent marketplace
- Ten different industry workflows
- Fully automatic posting without approval