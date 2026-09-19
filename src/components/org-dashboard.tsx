"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge, toneForStatus } from "@/components/status-badge";
import { money, phaseLabel, shortDate } from "@/lib/format";
import type { OrganizationSnapshot } from "@/types";

type Tab = "overview" | "agents" | "tasks" | "timeline" | "decisions" | "content" | "report";

const launchingOrgs = new Set<string>();

export function OrgDashboard({
  organizationId,
  initialTab = "overview",
}: {
  organizationId: string;
  initialTab?: Tab;
}) {
  const [snapshot, setSnapshot] = useState<OrganizationSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const response = await fetch(`/api/organizations/${organizationId}/snapshot`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not load organization");
      return;
    }
    setSnapshot(data);
    setError(null);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [organizationId]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (hash === "agents" || hash === "tasks" || hash === "timeline") setTab(hash);
  }, [organizationId]);

  async function act(path: string, id?: string) {
    setBusy(id ?? path);
    await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    await load();
    setBusy(null);
  }

  useEffect(() => {
    if (!snapshot || snapshot.run || launchingOrgs.has(organizationId)) return;
    launchingOrgs.add(organizationId);
    void act(`/api/organizations/${organizationId}/runs`, "start-run");
  }, [snapshot, organizationId]);

  if (error && !snapshot) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <p>{error}</p>
        <button type="button" onClick={() => void load()} className="mt-3 min-h-11 text-sm underline">
          Retry
        </button>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const { organization, run, agents, tasks, events, decisions, approvals, contentItems, report } = snapshot;
  const remaining = organization.budgetCents - organization.budgetUsedCents;
  const blocked = tasks.filter((task) => task.status === "blocked" || task.status === "approval_required");
  const pending = approvals.filter((item) => item.status === "pending");

  const orgHref = `/organizations/${organizationId}`;
  const tabs: Array<{ id: Tab; label: string; href: string }> = [
    { id: "overview", label: "Overview", href: orgHref },
    { id: "agents", label: "Agents", href: `${orgHref}#agents` },
    { id: "tasks", label: "Tasks", href: `${orgHref}#tasks` },
    { id: "timeline", label: "Timeline", href: `${orgHref}#timeline` },
    { id: "decisions", label: "Decisions", href: `${orgHref}/decisions` },
    { id: "content", label: "Content", href: `${orgHref}/content` },
    { id: "report", label: "Report", href: `${orgHref}/report` },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Organization</p>
          <h1 className="mt-2 text-[49px] font-normal leading-[60px] tracking-[-1.62px] text-[#f4f2f0]">{organization.name}</h1>
          <p className="mt-2 max-w-2xl text-[19px] leading-[29.4px] text-[#928c97]">{organization.goal}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={phaseLabel(run?.status)} tone="live" />
          {run?.demoMode ? <StatusBadge value="Demo mode" tone="warn" /> : run ? <StatusBadge value="Live providers" tone="good" /> : null}
          {!run ? (
            <button
              type="button"
              disabled={busy === "start-run"}
              onClick={() => void act(`/api/organizations/${organizationId}/runs`, "start-run")}
              className="inline-flex min-h-11 items-center rounded-[5px] border border-white bg-white px-4 text-sm text-[#221d2a] focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60"
            >
              {busy === "start-run" ? "Starting…" : "Launch agents"}
            </button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Phase" value={phaseLabel(run?.status)} />
        <Metric label="Budget used" value={`${money(organization.budgetUsedCents)} / ${money(organization.budgetCents)}`} />
        <Metric label="Remaining" value={money(remaining)} />
        <Metric label="Pending approvals" value={String(pending.length)} />
      </section>

      <nav className="flex flex-wrap gap-2" aria-label="Organization sections">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={(event) => {
              if (item.href === orgHref || item.href.startsWith(`${orgHref}#`)) {
                event.preventDefault();
                window.history.replaceState(null, "", item.href);
              }
              setTab(item.id);
            }}
            className={`inline-flex min-h-11 items-center rounded-[5px] px-4 text-sm focus-visible:ring-2 focus-visible:ring-[#c2b8ff] ${
              tab === item.id ? "bg-white text-[#221d2a]" : "border border-[#c2b8ff] text-[#c2b8ff]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Active agents">
            {agents.length === 0 ? (
              <Empty label={run ? "CEO is staffing the organization." : "Launch agents to start the Rivera run."} />
            ) : (
              <ul className="space-y-3">
                {agents.slice(0, 4).map((agent) => (
                  <li key={agent.id} className="flex items-center justify-between gap-3">
                    <span>{agent.name}</span>
                    <StatusBadge value={agent.status} tone={toneForStatus(agent.status)} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Blocked work">
            {blocked.length === 0 && pending.length === 0 ? (
              <Empty label="Nothing is blocked." />
            ) : (
              <ul className="space-y-3 text-sm">
                {blocked.map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
                {pending.map((approval) => (
                  <li key={approval.id} className="flex items-center justify-between gap-3">
                    <span>{approval.summary}</span>
                    <button
                      type="button"
                      disabled={busy === approval.id}
                      onClick={() => void act(`/api/approvals/${approval.id}/approve`, approval.id)}
                      className="min-h-11 rounded-lg bg-primary px-3 text-xs text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Approve
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}

      {tab === "agents" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.length === 0 ? <Empty label="Agents will appear after planning." /> : null}
          {agents.map((agent) => (
            <article key={agent.id} className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{agent.name}</h3>
                <StatusBadge value={agent.status} tone={toneForStatus(agent.status)} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{agent.objective}</p>
              <p className="mt-4 text-xs text-muted-foreground">{agent.lastAction ?? "Waiting for a task"}</p>
              <p className="mt-2 font-mono text-xs tabular-nums">
                {money(agent.spentCents)} spent
                {agent.confidence != null ? ` · ${Math.round(agent.confidence * 100)}% confidence` : ""}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "tasks" ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          {tasks.length === 0 ? (
            <div className="p-6">
              <Empty label="No tasks yet." />
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={task.status} tone={toneForStatus(task.status)} />
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">{money(task.actualCostCents ?? 0)}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{task.evaluation?.score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {tab === "timeline" ? (
        <ol className="space-y-4">
          {events.length === 0 ? <Empty label="No activity yet." /> : null}
          {events
            .slice()
            .reverse()
            .map((event) => (
              <li key={event.id} className="rounded-[10px] bg-[rgba(39,38,45,0.8)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">{event.summary}</p>
                  <time className="font-mono text-xs text-muted-foreground">{shortDate(event.createdAt)}</time>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{event.type}</p>
              </li>
            ))}
        </ol>
      ) : null}

      {tab === "decisions" ? (
        <div className="space-y-6">
          {decisions.length === 0 ? <Empty label="No decisions yet. Debate happens after feasibility." /> : null}
          {decisions.map((decision) => (
            <article key={decision.id} className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[29px] font-normal leading-[36px] text-[#f4f2f0]">{decision.question}</h2>
                <StatusBadge value={decision.status} tone={toneForStatus(decision.status)} />
              </div>
              <ul className="mt-6 space-y-4">
                {decision.proposals.map((proposal) => (
                  <li key={proposal.id} className="rounded-lg border border-border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{proposal.agentType}</p>
                    <p className="mt-2 text-sm">{proposal.recommendation}</p>
                  </li>
                ))}
              </ul>
              {decision.rationale ? (
                <p className="mt-6 text-sm">
                  <span className="text-muted-foreground">CEO decision: </span>
                  {decision.rationale}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {tab === "content" ? (
        <div className="grid gap-4">
          {contentItems.length === 0 ? <Empty label="Launch content appears after the social plan." /> : null}
          {contentItems.map((item) => (
            <article key={item.id} className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.platform}</p>
                  <h3 className="mt-1 font-medium">{item.title}</h3>
                </div>
                <StatusBadge value={item.status} tone={toneForStatus(item.status)} />
              </div>
              <p className="mt-3 text-sm">{item.hook}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.caption}</p>
              {item.demoPublished ? (
                <p className="mt-3 text-xs text-accent">Demo mode: publishing simulated</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded-lg bg-secondary px-4 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => void act(`/api/content/items/${item.id}/approve`, item.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg bg-secondary px-4 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => void act(`/api/content/items/${item.id}/reject`, `${item.id}-r`)}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg bg-secondary px-4 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => void act(`/api/content/items/${item.id}/regenerate`, `${item.id}-g`)}
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg bg-primary px-4 text-sm text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => void act(`/api/content/items/${item.id}/publish`, `${item.id}-p`)}
                >
                  Publish
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "report" ? (
        report ? (
          <article className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-6">
            <h2 className="text-[49px] font-normal leading-[60px] tracking-[-1.62px] text-[#c2b8ff]">Final recommendation</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Metric label="Opportunity" value={`${report.opportunityScore}`} />
              <Metric label="Evidence" value={`${report.evidenceQuality}`} />
              <Metric label="Budget fit" value={`${report.budgetFit}`} />
              <Metric label="Feasibility" value={`${report.technicalFeasibility}`} />
              <Metric label="Problem" value={`${report.problemStrength}`} />
              <Metric label="Distribution" value={`${report.distributionPotential}`} />
            </div>
            <h3 className="mt-8 text-sm font-medium">Main risks</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {report.mainRisks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-medium">Next steps</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {report.recommendedNextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </article>
        ) : (
          <Empty label="The evaluator has not closed the report yet." />
        )
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-lg tabular-nums">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: import("react").ReactNode }) {
  return (
    <section className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}
