import Link from "next/link";
import type { ReactNode } from "react";
import { AGENT_ROSTER } from "@/lib/demo/fixtures";
import { Bullet, Callout, CodeBlock, DocTable, InlineCode, Steps } from "./ui";

export const DOCS_ARTICLES: Record<string, () => ReactNode> = {
  "": Overview,
  "quick-start": QuickStart,
  "demo-mode": DemoMode,
  runs: Runs,
  agents: Agents,
  dashboard: Dashboard,
  approvals: Approvals,
  content: Content,
  inbox: Inbox,
  environment: Environment,
  api: Api,
  safety: Safety,
};

function Overview() {
  return (
    <>
      <p>
        Rivera is an AI product-launch organization. You give it a goal. It staffs specialists, researches the
        opportunity, debates the wedge, plans an MVP, drafts launch content, and stops before anything publishes.
      </p>
      <p>
        It is outcome-driven, not a chatbot. A goal becomes a plan, a plan becomes tasks, and every important action
        lands on the timeline.
      </p>
      <h2>What you get from a run</h2>
      <Bullet>
        <li>Evidence-backed research and a competitor scan</li>
        <li>A product recommendation with confidence</li>
        <li>A technical MVP plan that fits the budget and deadline</li>
        <li>Hiring shortlist roles inferred from your brief</li>
        <li>Launch posts for X, LinkedIn, Instagram, and TikTok</li>
        <li>A final report and a human approval request before publish</li>
      </Bullet>
      <h2>Start here</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <DocCard href="/docs/quick-start" title="Quick start" body="Sign in and run the first org." />
        <DocCard href="/docs/runs" title="How a run works" body="Phases, caps, and resume." />
        <DocCard href="/docs/agents" title="Agents" body="Who does what on a launch." />
        <DocCard href="/docs/safety" title="Safety" body="What never ships without you." />
      </div>
    </>
  );
}

function DocCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="rounded-[10px] border border-[rgba(194,184,255,0.22)] bg-[#1f1c26] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
    >
      <p className="text-[18px] leading-[24px] text-[#f4f2f0]">{title}</p>
      <p className="mt-2 text-[14px] leading-[22px] text-[#928c97]">{body}</p>
    </Link>
  );
}

function QuickStart() {
  return (
    <>
      <p>
        Local Rivera needs Node 20+, pnpm, and Postgres. Sign in is required before a sandbox starts. The prompt is
        saved as launch context first; role chips appear after that.
      </p>
      <h2>Install</h2>
      <CodeBlock>{`pnpm install
createdb rivera
cp .env.example .env
pnpm migrate
pnpm test
pnpm dev`}</CodeBlock>
      <p>
        Open <InlineCode>http://localhost:3000</InlineCode>. Clerk keys live in <InlineCode>.env.local</InlineCode>.
        Leave <InlineCode>LLM_API_KEY</InlineCode> empty to run labeled demo fixtures.
      </p>
      <h2>First run</h2>
      <Steps>
        <li>Sign in or create an account.</li>
        <li>Describe the product you want to launch. Enter saves that as the brief.</li>
        <li>Confirm or change the inferred hiring roles, then start.</li>
        <li>Watch Overview, Agents, Tasks, and Timeline as the org works.</li>
      </Steps>
      <Callout title="Demo goal">
        Build a developer tool that helps Stellar developers debug Soroban transactions in 30 days with a $500 budget.
      </Callout>
      <p>
        Postgres is required for the app. The first request migrates the schema. Unit tests use an in-memory store.
      </p>
    </>
  );
}

function DemoMode() {
  return (
    <>
      <p>
        Demo mode uses the same interfaces as live providers. The dashboard labels it. Simulated publishing never looks
        like a real post.
      </p>
      <h2>When it is on</h2>
      <p>Rivera uses fixtures when any of these is true:</p>
      <Bullet>
        <li>
          <InlineCode>DEMO_MODE=true</InlineCode>
        </li>
        <li>
          <InlineCode>LLM_API_KEY</InlineCode> is empty
        </li>
        <li>A live provider fails and the orchestrator falls back</li>
      </Bullet>
      <h2>What is simulated</h2>
      <DocTable
        headers={["Surface", "Demo behavior"]}
        rows={[
          ["LLM agents", "Deterministic JSON from fixtures, scored like live output"],
          ["Web search / GitHub", "Cached research unless Tavily or a GitHub token is set"],
          ["Higgsfield media", "Queued jobs with preview assets, no live spend"],
          ["Social publish", "Drafts and a labeled demo URL"],
          ["Gmail", "Sample inbox via Preview sample inbox"],
        ]}
      />
      <Callout title="Live providers">
        Set <InlineCode>LLM_API_KEY</InlineCode> and leave <InlineCode>DEMO_MODE</InlineCode> false. Optional: Tavily,
        GitHub, Higgsfield, Gmail, and X credentials.{" "}
        <Link href="/docs/environment">Environment reference</Link>.
      </Callout>
    </>
  );
}

function Runs() {
  return (
    <>
      <p>
        A run is one execution of the organization against your goal. Allowed phase transitions are explicit. Agents do
        not loop forever.
      </p>
      <h2>Phases</h2>
      <CodeBlock>{`INTAKE → PLANNING → RESEARCH → FEASIBILITY → DEBATE → DECISION
  → BUILD_PLAN → CONTENT_PLAN → MEDIA_GENERATION → REVIEW → APPROVAL
  → SCHEDULED → PUBLISHED → EVALUATION → COMPLETE`}</CodeBlock>
      <p>
        Some runs stop at review when you only want drafts. Failed and cancelled are terminal. Publishing a post still
        requires an approval even if the phase machine can reach <InlineCode>published</InlineCode>.
      </p>
      <h2>Caps</h2>
      <DocTable
        headers={["Cap", "Default"]}
        rows={[
          ["Max steps", "24"],
          ["Max cost", "$200"],
          ["Max duration", "15 minutes"],
          ["Max retries", "1"],
        ]}
      />
      <p>
        Vercel Hobby functions are shorter than that window. On Hobby, start the run again to resume a non-terminal
        org. Docker keeps the full 15 minutes.
      </p>
      <h2>Resume</h2>
      <p>
        <InlineCode>POST /api/organizations/:id/runs</InlineCode> starts a run, or continues one that is not complete,
        failed, or cancelled. The dashboard does this automatically when you open an org that still needs work.
      </p>
    </>
  );
}

function Agents() {
  return (
    <>
      <p>
        Every organization gets a CEO plus specialists. Founder runs staff research, competitor, strategy, engineering,
        hiring, social, and inbox. Finance, marketing, and evaluator join when the plan asks for them.
      </p>
      <DocTable
        headers={["Agent", "Job", "Tools"]}
        rows={AGENT_ROSTER.map((agent) => [
          agent.name,
          agent.objective,
          agent.tools.length ? agent.tools.join(", ") : "—",
        ])}
      />
      <h2>Outputs</h2>
      <p>
        Agents return structured JSON: status, summary, findings, evidence, risks, recommendation, confidence, and
        artifacts. The evaluator scores completeness, source quality, and budget honesty. Unsupported claims do not
        pass as facts.
      </p>
    </>
  );
}

function Dashboard() {
  return (
    <>
      <p>
        The organization page is the live console. It polls every two seconds. Tabs match the work, not a chat log.
      </p>
      <DocTable
        headers={["Tab", "What it shows"]}
        rows={[
          ["Overview", "Goal, phase, budget used, blocked work, pending approvals, inbox"],
          ["Agents", "Role, status, current task, confidence, last action"],
          ["Tasks", "Assignment, dependencies, cost, evaluation score"],
          ["Timeline", "Created, assigned, tool calls, debates, artifacts, approvals"],
          ["Decisions", "Question, agent proposals, CEO call, confidence"],
          ["Content", "Campaign items, captions, media, review actions"],
          ["Report", "Opportunity score, risks, recommended next steps"],
        ]}
      />
      <p>
        Demo mode and live providers are badged on the header. If a run has not started, opening the org launches it.
      </p>
    </>
  );
}

function Approvals() {
  return (
    <>
      <p>
        Drafting is allowed without you. Publishing, scheduling, spending, deploying, and sending external messages are
        not. Auto-publish is off unless you set it on the org.
      </p>
      <DocTable
        headers={["Action", "When it appears"]}
        rows={[
          ["publish_social_post", "A content item is ready to go live"],
          ["schedule_social_post", "A post is queued for a time"],
          ["spend_budget", "A step would spend past a safe threshold"],
          ["deploy_production", "Reserved for irreversible ship actions"],
          ["send_external_message", "Mail or similar outbound"],
        ]}
      />
      <p>
        Pending approvals sit on Overview. Approve or reject from the dashboard. Expired approvals cannot be granted.
        The activity timeline records every request, grant, and rejection.
      </p>
      <Callout tone="warn" title="Publish">
        No post is published automatically. Enable auto-publish only if you want that risk.
      </Callout>
    </>
  );
}

function Content() {
  return (
    <>
      <p>
        After the strategy is in, the social agent turns it into a campaign. You review captions, media, and claims
        before anything leaves Rivera.
      </p>
      <h2>Pipeline</h2>
      <CodeBlock>{`Product strategy → content plan → posts → media jobs → review
  → approve / reject / regenerate → schedule or publish`}</CodeBlock>
      <h2>Platforms and types</h2>
      <p>Hackathon support: X, LinkedIn, Instagram Reels, TikTok. Types: text, image, video, carousel.</p>
      <h2>Media</h2>
      <p>
        Higgsfield jobs are asynchronous. Rivera stores the provider job id, waits for a webhook or poll, copies the
        file into S3 when <InlineCode>S3_BUCKET</InlineCode> is set, and attaches a preview. Local demo fixtures stay
        on disk. Cost ceilings apply per job. Secrets stay server-side.
      </p>
      <p>
        On the Content tab you can edit, approve, reject, regenerate, schedule, or publish. Demo publishing is labeled.
        Live X publishing needs X API credentials.
      </p>
    </>
  );
}

function Inbox() {
  return (
    <>
      <p>
        The inbox agent reads connected Gmail and surfaces mail that looks relevant to this launch: demand, hiring
        replies, partner notes. It is read-only.
      </p>
      <h2>Connect</h2>
      <Steps>
        <li>
          Create a Google OAuth client, enable Gmail API, and add{" "}
          <InlineCode>{"{APP_URL}/api/gmail/callback"}</InlineCode> as a redirect URI.
        </li>
        <li>
          Set <InlineCode>GOOGLE_CLIENT_ID</InlineCode> and <InlineCode>GOOGLE_CLIENT_SECRET</InlineCode>.
        </li>
        <li>On the org Overview, connect Gmail, then Scan inbox.</li>
      </Steps>
      <p>
        Without Google credentials, Preview sample inbox loads labeled demo mail so the rest of the run still has an
        inbox task.
      </p>
      <h2>Relevance</h2>
      <p>
        Messages are scored against the org goal, domain, target user, technology, and hiring roles. Only items marked
        relevant are highlighted. Nothing is sent from this inbox path.
      </p>
    </>
  );
}

function Environment() {
  return (
    <>
      <p>
        Copy <InlineCode>.env.example</InlineCode>. Never commit <InlineCode>.env</InlineCode> or Clerk secrets.
        Production must set <InlineCode>DATABASE_URL</InlineCode>. The in-memory store is rejected unless{" "}
        <InlineCode>ALLOW_MEMORY_STORE=true</InlineCode>.
      </p>
      <DocTable
        headers={["Variable", "Required", "Role"]}
        rows={[
          ["DATABASE_URL", "Yes", "Pooled Postgres"],
          ["RIVERA_STORE", "Yes", "postgres in the app"],
          ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY", "Yes", "Sign-in before a sandbox"],
          ["APP_URL", "Prod", "Origin for Gmail and Higgsfield callbacks"],
          ["LLM_API_KEY", "No", "Empty = demo fixtures"],
          ["TAVILY_API_KEY / GITHUB_TOKEN", "No", "Live research tools"],
          ["HIGGSFIELD_API_KEY_ID / SECRET", "No", "Live media"],
          ["S3_BUCKET / AWS_REGION / AWS keys", "No", "Copy completed media into S3"],
          ["S3_PUBLIC_BASE_URL", "No", "CloudFront or custom media origin"],
          ["GOOGLE_CLIENT_ID / SECRET", "No", "Gmail inbox"],
          ["X_API_KEY and tokens", "No", "Live X publish"],
          ["DEMO_MODE / AUTO_PUBLISH", "No", "Force fixtures / opt-in publish"],
        ]}
      />
      <h2>Deploy</h2>
      <p>
        Vercel plus hosted Postgres (Neon, Supabase, or Vercel Postgres) is the default. Use the pooled connection
        string with <InlineCode>sslmode=require</InlineCode>. After deploy, set <InlineCode>APP_URL</InlineCode> to the
        production origin and hit <InlineCode>/api/health</InlineCode>. It should report store postgres and database ok.
        Set <InlineCode>S3_BUCKET</InlineCode> if completed Higgsfield files should live in AWS instead of on provider
        URLs.
      </p>
      <CodeBlock>{`docker build -t rivera .
docker run --env-file .env -p 3000:3000 rivera`}</CodeBlock>
    </>
  );
}

function Api() {
  return (
    <>
      <p>
        The dashboard is the supported client. These routes are what it calls. Creating an organization requires a
        signed-in Clerk user.
      </p>
      <DocTable
        headers={["Method", "Path", "Purpose"]}
        rows={[
          ["GET", "/api/health", "Store, database, demo, Clerk, Gmail checks"],
          ["POST", "/api/organizations", "Create org from a goal (auth required)"],
          ["GET", "/api/organizations", "List orgs you own"],
          ["GET", "/api/organizations/:id/snapshot", "Full dashboard payload"],
          ["POST", "/api/organizations/:id/runs", "Start or resume a run"],
          ["GET", "/api/runs/:id/events", "Activity timeline"],
          ["POST", "/api/runs/:id/cancel", "Stop a run"],
          ["POST", "/api/tasks/:id/retry", "Retry a failed task"],
          ["POST", "/api/decisions/:id/approve", "Accept a CEO decision"],
          ["POST", "/api/approvals/:id/approve", "Grant a human gate"],
          ["POST", "/api/content/items/:id/approve", "Approve a post"],
          ["POST", "/api/content/items/:id/publish", "Publish after approval"],
          ["POST", "/api/content/items/:id/generate-media", "Queue Higgsfield"],
          ["POST", "/api/webhooks/higgsfield", "Media job callback"],
          ["GET", "/api/organizations/:id/gmail/connect", "Start Gmail OAuth"],
          ["POST", "/api/organizations/:id/gmail/sync", "Scan inbox"],
        ]}
      />
      <p>
        Health is public. Higgsfield webhooks verify a signature. Other mutating routes are meant for the signed-in
        dashboard session.
      </p>
    </>
  );
}

function Safety() {
  return (
    <>
      <p>
        Rivera is built so a demo cannot pretend to be a live launch, and a live launch cannot spend or publish without
        you.
      </p>
      <h2>Always requires you</h2>
      <Bullet>
        <li>Publishing or scheduling social posts</li>
        <li>Spending past the org budget</li>
        <li>Sending external messages</li>
        <li>Deploying to production</li>
      </Bullet>
      <h2>Always true</h2>
      <Bullet>
        <li>Provider secrets stay on the server</li>
        <li>Demo actions are labeled in the UI</li>
        <li>Every external call is logged on the timeline</li>
        <li>Media jobs have a cost ceiling</li>
        <li>You can cut access. Your product and data remain yours</li>
      </Bullet>
      <Callout title="Non-goals">
        Rivera is not a general social suite, an ad buyer, or an autonomous poster. Unlimited video generation and a
        public agent marketplace are out of scope.
      </Callout>
    </>
  );
}
