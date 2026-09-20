/**
 * Compile a build brief from Rivera's research, strategy, and engineering
 * outputs so a Cursor cloud agent gets a specific plan rather than a chat-box
 * prompt. This is the whole reason to use Rivera as a launch org and Cursor
 * as the builder — we send the wedge, not "build a todo list app".
 */

import type { AgentOutput, AgentType, Organization, Task } from "@/types";

export type BuildBriefInput = {
  organization: Organization;
  tasks: Task[];
  repoFullName?: string;
  branch?: string;
};

function outputFor(tasks: Task[], type: AgentType): AgentOutput | undefined {
  for (const task of tasks) {
    const output = task.output as AgentOutput | undefined;
    if (output && output.agentType === type) return output;
  }
  return undefined;
}

function bullet(items: unknown[] | undefined, limit = 6): string {
  if (!items || items.length === 0) return "";
  return items
    .slice(0, limit)
    .map((item) => `- ${String(typeof item === "object" ? JSON.stringify(item) : item)}`)
    .join("\n");
}

function section(title: string, body: string): string {
  if (!body.trim()) return "";
  return `## ${title}\n${body.trim()}\n`;
}

export function compileBuildBrief(input: BuildBriefInput): string {
  const { organization, tasks } = input;
  const research = outputFor(tasks, "research");
  const strategy = outputFor(tasks, "strategy");
  const engineering = outputFor(tasks, "engineering");

  const parts: string[] = [];
  parts.push(`# ${organization.name}: 30-day MVP build`);
  parts.push(
    `Rivera has picked the wedge. Your job is to ship it as a working repository, not to redesign the product. Follow the plan below; only push back if something is technically impossible.`,
  );

  parts.push(
    section(
      "Goal",
      [
        `- Product goal: ${organization.goal}`,
        organization.targetUser ? `- Target user: ${organization.targetUser}` : "",
        organization.technology ? `- Preferred stack: ${organization.technology}` : "",
        organization.deadline ? `- Deadline: ${organization.deadline}` : "",
        organization.budgetCents
          ? `- Budget cap: $${(organization.budgetCents / 100).toFixed(0)} (design cheaply)`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  );

  if (strategy) {
    parts.push(
      section(
        "Strategy",
        [
          strategy.recommendation ? `- Wedge: ${strategy.recommendation}` : "",
          bullet(strategy.findings, 5),
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    );
  }

  if (engineering) {
    parts.push(
      section(
        "Engineering plan",
        [
          engineering.recommendation ? `- Approach: ${engineering.recommendation}` : "",
          bullet(engineering.findings, 8),
          engineering.risks && engineering.risks.length
            ? `\n### Known risks\n${bullet(engineering.risks, 5)}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    );
  }

  if (research?.evidence && research.evidence.length) {
    parts.push(section("Evidence to respect", bullet(research.evidence, 5)));
  }

  parts.push(
    section(
      "Do this",
      [
        "- Scaffold the smallest working version of the wedge above.",
        "- Prefer boring, well-known libraries over novel infra.",
        "- Add a README with setup, run, and test instructions.",
        "- Add at least one automated test that proves the core path works.",
        "- Keep external service dependencies to the minimum needed for the demo.",
        input.repoFullName ? `- Push work to \`${input.repoFullName}\`${input.branch ? ` on a feature branch off \`${input.branch}\`` : ""}.` : "",
        "- Open a pull request with a summary of what you built and what is out of scope.",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  );

  parts.push(
    section(
      "Do NOT do this",
      [
        "- Do not expand scope beyond the wedge above.",
        "- Do not add auth, billing, or analytics unless the plan calls for them.",
        "- Do not commit secrets. Use env vars and document them in `.env.example`.",
        "- Do not force a specific cloud provider — the founder will decide hosting later.",
      ].join("\n"),
    ),
  );

  return parts.filter(Boolean).join("\n").trim();
}
