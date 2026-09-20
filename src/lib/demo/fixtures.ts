import type { z } from "zod";
import type { ceoPlanSchema } from "@/lib/agents/schema";
import type { AgentType, ContentPlatform } from "@/types";

export type DemoCeoPlan = z.infer<typeof ceoPlanSchema>;

export const AGENT_ROSTER: Array<{
  type: AgentType;
  name: string;
  tools: string[];
  objective: string;
}> = [
  {
    type: "ceo",
    name: "CEO / Orchestrator",
    tools: [],
    objective: "Coordinate the Rivera organization and produce a final recommendation.",
  },
  {
    type: "research",
    name: "Research",
    tools: ["webSearch", "github"],
    objective: "Collect evidence for the user problem and competitive landscape.",
  },
  {
    type: "strategy",
    name: "Strategy",
    tools: [],
    objective: "Choose the wedge, target user, and go / no-go recommendation.",
  },
  {
    type: "engineering",
    name: "Engineering",
    tools: ["calculator"],
    objective: "Design a feasible MVP architecture and implementation plan.",
  },
  {
    type: "finance",
    name: "Finance",
    tools: ["calculator"],
    objective: "Fit the plan to the budget and surface financial risk.",
  },
  {
    type: "marketing",
    name: "Marketing",
    tools: [],
    objective: "Name, position, and message the launch.",
  },
  {
    type: "social_media",
    name: "Social Media",
    tools: [],
    objective: "Turn the approved strategy into platform-specific launch content.",
  },
  {
    type: "hiring",
    name: "Hiring",
    tools: ["webSearch"],
    objective: "Find candidate LinkedIn profiles for the roles the founder needs.",
  },
  {
    type: "competitor",
    name: "Competitor",
    tools: ["webSearch"],
    objective: "Surface competing products from Reddit, Hacker News, and the open web.",
  },
  {
    type: "evaluator",
    name: "Evaluator",
    tools: [],
    objective: "Score evidence, completeness, and budget honesty.",
  },
];

export const FOUNDER_AGENT_TYPES = [
  "research",
  "competitor",
  "strategy",
  "engineering",
  "hiring",
  "social_media",
] as const;

export const DEFAULT_HIRING_ROLES = [
  "Founding Engineer",
  "AI Engineer",
  "Systems Architect",
];

export const FOUNDER_AGENTS = AGENT_ROSTER.filter((agent) =>
  (FOUNDER_AGENT_TYPES as readonly string[]).includes(agent.type),
).map((agent) => ({
  type: agent.type as (typeof FOUNDER_AGENT_TYPES)[number],
  name: agent.name,
  tools: agent.tools,
  objective: agent.objective,
}));

export const FOUNDER_TASKS = [
  {
    title: "Research the problem",
    description: "Find public evidence that this user pain is real.",
    agentType: "research" as const,
    estimatedCostCents: 40,
  },
  {
    title: "Choose the wedge",
    description: "Pick what to ship first, who it is for, and the go / no-go call.",
    agentType: "strategy" as const,
    dependsOnTitles: ["Research the problem"],
    estimatedCostCents: 20,
  },
  {
    title: "Plan the 30-day MVP",
    description: "Architecture, scope cuts, and a budget that fits the deadline.",
    agentType: "engineering" as const,
    dependsOnTitles: ["Choose the wedge"],
    estimatedCostCents: 20,
  },
  {
    title: "Scan the competition",
    description: "Reddit, Hacker News, and the open web for products doing this today.",
    agentType: "competitor" as const,
    dependsOnTitles: ["Research the problem"],
    estimatedCostCents: 20,
  },
  {
    title: "Shortlist hires",
    description: "Find public LinkedIn profiles for the roles the founder needs.",
    agentType: "hiring" as const,
    dependsOnTitles: ["Choose the wedge"],
    estimatedCostCents: 20,
  },
  {
    title: "Draft launch posts",
    description: "Write X and LinkedIn posts the founder can edit, approve, and publish.",
    agentType: "social_media" as const,
    dependsOnTitles: ["Choose the wedge"],
    estimatedCostCents: 20,
  },
];

export function demoCeoPlan(goal: string): DemoCeoPlan {
  const stellar = /stellar|soroban/i.test(goal);
  return {
    organizationName: stellar ? "Trace" : "Rivera Launch",
    domain: stellar ? "stellar-developer-tools" : "developer-tools",
    summary: stellar
      ? "The strongest 30-day, $500 wedge is a local CLI that decodes failed Soroban simulations."
      : `Rivera planned a 30-day MVP around: ${goal}`,
    recommendation: stellar
      ? "Build a CLI first. Position a hosted dashboard as the paid upgrade."
      : "Ship the smallest demoable wedge, then charge for hosted convenience.",
    confidence: 0.78,
    agents: FOUNDER_AGENTS.map((agent) => ({
      type: agent.type,
      objective: agent.objective,
      tools: agent.tools,
    })),
    tasks: FOUNDER_TASKS.map((task) => ({ ...task })),
  };
}

export function demoSpecialistOutput(agentType: AgentType, goal: string) {
  const stellar = /stellar|soroban/i.test(goal);
  const shared = {
    status: "success" as const,
    confidence: 0.74,
    artifacts: [`${agentType}-report`],
    estimatedCostCents: 8,
    findings: [] as unknown[],
    evidence: [] as unknown[],
    risks: [] as unknown[],
  };

  switch (agentType) {
    case "research":
      return {
        ...shared,
        summary: stellar
          ? "Soroban developers waste hours decoding failed simulations; no focused 30-day tool owns that job."
          : "Developers want a narrower debugging loop than current generic tooling.",
        findings: [
          "Opaque transaction errors are the top complaint",
          "Hosted dashboards are liked for demos but slow for daily use",
        ],
        evidence: [
          { url: "https://github.com/stellar/soroban-tools/issues/1842", quality: "primary" },
          { url: "https://developers.stellar.org/docs/build/guides/testing", quality: "docs" },
        ],
        risks: ["Public evidence is still thin; talk to 5 developers this week"],
        recommendation: "Pursue a local-first debugger.",
      };
    case "strategy":
      return {
        ...shared,
        summary: "CLI first, hosted dashboard later as the paid upgrade.",
        findings: ["Wedge: decode + replay a failed Soroban invoke in under 30 seconds"],
        risks: ["A hosted-only MVP blows the $500 budget"],
        recommendation: "Build the CLI first and keep the dashboard as an upsell.",
      };
    case "engineering":
      return {
        ...shared,
        summary: "TypeScript CLI wrapping the Stellar/Soroban SDK, plus a fixture replay suite.",
        findings: [
          "MVP: decode XDR, print auth/footprint, replay against localnet",
          "Skip hosting, auth, and multi-tenant storage",
        ],
        risks: ["RPC reliability on public testnet"],
        recommendation: "Ship a CLI named Trace with recorded fixtures.",
      };
    case "finance":
      return {
        ...shared,
        summary: "The 30-day plan fits $500 if media spend stays under $80 and infra stays local.",
        findings: [
          { item: "Founder time", cents: 0 },
          { item: "LLM + search", cents: 12000 },
          { item: "Higgsfield media", cents: 8000 },
          { item: "Domains / extras", cents: 3000 },
        ],
        risks: ["Video regeneration can blow the media ceiling"],
        recommendation: "Cap media at $80 and keep the product local-first.",
      };
    case "marketing":
      return {
        ...shared,
        summary: stellar
          ? "Name: Trace. Promise: see why a Soroban transaction failed in one command."
          : "Name the wedge after the outcome, not the architecture.",
        findings: ["Channel: X + Stellar Discord + one LinkedIn founder note"],
        risks: ["Overclaiming 'production debugger' too early"],
        recommendation: "Lead with a 20-second CLI demo, not a landing-page essay.",
      };
    case "social_media":
      return {
        ...shared,
        summary: "Launch posts are drafted and waiting for the founder to review.",
        findings: ["Channels: X + LinkedIn", "Publish stays off until approval"],
        recommendation: "Review captions before any publish.",
        artifacts: ["content-campaign"],
      };
    case "hiring":
      return {
        ...shared,
        summary: "Shortlist of public LinkedIn profiles for the requested roles.",
        findings: ["Roles pulled from intake; profiles came from web search"],
        risks: ["LinkedIn results depend on public indexing; always double-check"],
        recommendation: "Reach out to two names per role this week.",
      };
    case "competitor":
      return {
        ...shared,
        summary: "Found a handful of products and community threads covering the same job.",
        findings: ["Reddit + Hacker News threads gave the most direct comparisons"],
        risks: ["An incumbent may already own this wedge"],
        recommendation: "Pick one competitor to explicitly beat on speed or price.",
      };
    case "evaluator":
      return {
        ...shared,
        confidence: 0.71,
        summary: "The package is coherent. Evidence is real but thin. Budget fits if media stays capped.",
        findings: [
          { metric: "opportunityScore", value: 78 },
          { metric: "problemStrength", value: 82 },
          { metric: "evidenceQuality", value: 64 },
          { metric: "technicalFeasibility", value: 80 },
          { metric: "budgetFit", value: 86 },
          { metric: "distributionPotential", value: 70 },
        ],
        risks: ["Need five founder interviews before calling this validated"],
        recommendation: "Proceed to content review, then one approved X post.",
      };
    default:
      return {
        ...shared,
        summary: "CEO coordinated the next Rivera step.",
        recommendation: "Continue.",
      };
  }
}

export function demoContentItems(platforms: ContentPlatform[], productName = "the product") {
  const defaults: ContentPlatform[] = ["x", "linkedin"];
  const list = platforms.length ? platforms : defaults;
  return list.map((platform) => ({
    platform,
    type: platform === "x" || platform === "linkedin" ? ("text" as const) : ("video" as const),
    title:
      platform === "linkedin"
        ? `Why we're building ${productName}`
        : `See ${productName} in one command`,
    hook: "The current loop is too slow. Here's the narrower job.",
    script:
      platform === "x"
        ? undefined
        : "Open with the failed workflow. Cut to the 30-day wedge. End on a single call to action.",
    caption:
      platform === "linkedin"
        ? `We're building ${productName} so the target user can finish the painful job without a hosted stack.`
        : `${productName}: the 30-day wedge. Built on a tight budget. Review before anything publishes.`,
    callToAction: "Reply if this is your job",
    hashtags: ["#buildinpublic", "#devtools"],
    claimsUsed: ["30-day MVP", "founder-approved publish"],
  }));
}
