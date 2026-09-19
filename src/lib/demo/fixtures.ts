import type { AgentType, ContentPlatform } from "@/types";

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
    type: "evaluator",
    name: "Evaluator",
    tools: [],
    objective: "Score evidence, completeness, and budget honesty.",
  },
];

export function demoCeoPlan(goal: string) {
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
    agents: AGENT_ROSTER.filter((agent) => agent.type !== "ceo").map((agent) => ({
      type: agent.type,
      objective: agent.objective,
      tools: agent.tools,
    })),
    tasks: [
      {
        title: "Research developer pain",
        description: "Collect public evidence of the debugging problem.",
        agentType: "research" as const,
        estimatedCostCents: 40,
      },
      {
        title: "Choose the product wedge",
        description: "Recommend CLI vs hosted dashboard and the first user.",
        agentType: "strategy" as const,
        dependsOnTitles: ["Research developer pain"],
        estimatedCostCents: 20,
      },
      {
        title: "Draft MVP architecture",
        description: "Repository, API, and test plan that fits 30 days.",
        agentType: "engineering" as const,
        dependsOnTitles: ["Choose the product wedge"],
        estimatedCostCents: 20,
      },
      {
        title: "Budget the first 30 days",
        description: "Cost the build, tools, and media against $500.",
        agentType: "finance" as const,
        dependsOnTitles: ["Draft MVP architecture"],
        estimatedCostCents: 10,
      },
      {
        title: "Write launch messaging",
        description: "Name, positioning, and first-user acquisition.",
        agentType: "marketing" as const,
        dependsOnTitles: ["Choose the product wedge"],
        estimatedCostCents: 15,
      },
      {
        title: "Create social campaign",
        description: "Hooks, captions, and platform variants.",
        agentType: "social_media" as const,
        dependsOnTitles: ["Write launch messaging"],
        estimatedCostCents: 20,
      },
      {
        title: "Evaluate the package",
        description: "Score evidence, feasibility, and missing work.",
        agentType: "evaluator" as const,
        dependsOnTitles: ["Budget the first 30 days", "Create social campaign"],
        estimatedCostCents: 10,
      },
    ],
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
        summary: "Four-platform launch kit is drafted and waiting for human review.",
        findings: ["Pillars: problem, demo, founder note, countdown"],
        recommendation: "Review captions before any publish.",
        artifacts: ["content-campaign"],
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

export function demoContentItems(platforms: ContentPlatform[]) {
  const defaults: ContentPlatform[] = ["x", "linkedin", "instagram", "tiktok"];
  const list = platforms.length ? platforms : defaults;
  return list.map((platform) => ({
    platform,
    type: platform === "x" || platform === "linkedin" ? ("text" as const) : ("video" as const),
    title:
      platform === "linkedin"
        ? "Why Soroban errors still waste a day"
        : "See the failed Soroban tx in one command",
    hook: "Your simulate() just failed. Now what?",
    script:
      platform === "x"
        ? undefined
        : "Open with the raw error. Cut to one CLI command. End on the decoded auth and events.",
    caption:
      platform === "linkedin"
        ? "We are building Trace: a 30-day CLI so Stellar developers can decode a failed Soroban transaction without a hosted stack."
        : "Trace: decode a failed Soroban transaction in one command. Built in 30 days on $500.",
    callToAction: "Follow for the CLI drop",
    hashtags: ["#Stellar", "#Soroban", "#devtooling"],
    claimsUsed: ["30-day MVP", "local-first CLI", "$500 budget"],
  }));
}
