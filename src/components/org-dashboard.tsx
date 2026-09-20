"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge, toneForStatus } from "@/components/status-badge";
import { cn } from "@/lib/cn";
import { money, phaseLabel, shortDate } from "@/lib/format";
import { HIRING_ROLE_PRESETS, suggestHiringRoles } from "@/lib/intake/roles";
import { evidenceFromEvents, toolMetricsFromEvents } from "@/lib/research/evidence";
import type { Asset, OrganizationSnapshot } from "@/types";

export type DashboardTab = "overview" | "agents" | "tasks" | "timeline" | "decisions" | "content" | "build" | "report";

const launchingOrgs = new Set<string>();

export function OrgDashboard({
  organizationId,
  initialTab = "overview",
  initialSnapshot = null,
}: {
  organizationId: string;
  initialTab?: DashboardTab;
  initialSnapshot?: OrganizationSnapshot | null;
}) {
  const [snapshot, setSnapshot] = useState<OrganizationSnapshot | null>(initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DashboardTab>(initialTab);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/snapshot`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not load organization");
        return;
      }
      setSnapshot(data);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load organization");
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [organizationId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailError = params.get("gmail");
    if (!gmailError) return;
    setError(`Gmail: ${gmailError.replaceAll("_", " ")}`);
    params.delete("gmail");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, [organizationId]);

  async function act(path: string, id?: string) {
    setBusy(id ?? path);
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await response.json().catch(() => ({}));
    await load();
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Action failed");
    }
    setBusy(null);
  }

  useEffect(() => {
    if (!snapshot || launchingOrgs.has(organizationId)) return;
    const waiting = ["review", "approval", "scheduled", "published", "evaluation", "complete", "failed", "cancelled"];
    const needsLaunch = !snapshot.run;
    const needsResume = Boolean(snapshot.run && !waiting.includes(snapshot.run.status) && snapshot.agents.length === 0);
    if (!needsLaunch && !needsResume) return;
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

  const {
    organization,
    run,
    agents,
    tasks,
    events,
    decisions,
    approvals,
    contentItems,
    mediaJobs,
    assets,
    report,
    gmail = { configured: false, connected: false },
    inboxMessages = [],
  } = snapshot;
  const remaining = organization.budgetCents - organization.budgetUsedCents;
  const blocked = tasks.filter((task) => task.status === "blocked" || task.status === "approval_required");
  const pending = approvals.filter((item) => item.status === "pending");
  const evidence = evidenceFromEvents(events);
  const toolMetrics = toolMetricsFromEvents(events);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const relevantMail = inboxMessages.filter((item) => item.relevant);

  const orgHref = `/organizations/${organizationId}`;
  const tabs: Array<{ id: DashboardTab; label: string; href: string }> = [
    { id: "overview", label: "Overview", href: orgHref },
    { id: "agents", label: "Agents", href: `${orgHref}#agents` },
    { id: "tasks", label: "Tasks", href: `${orgHref}#tasks` },
    { id: "timeline", label: "Timeline", href: `${orgHref}#timeline` },
    { id: "decisions", label: "Decisions", href: `${orgHref}/decisions` },
    { id: "content", label: "Content", href: `${orgHref}/content` },
    { id: "build", label: "Build", href: `${orgHref}/build` },
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
          {busy === "start-run" ? <StatusBadge value="Launching agents" tone="live" /> : null}
          {!run && busy !== "start-run" ? (
            <button
              type="button"
              onClick={() => void act(`/api/organizations/${organizationId}/runs`, "start-run")}
              className="inline-flex min-h-11 items-center rounded-[5px] border border-white bg-white px-4 text-sm text-[#221d2a] focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60"
            >
              Launch agents
            </button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Phase" value={phaseLabel(run?.status)} />
        <Metric label="Budget used" value={`${money(organization.budgetUsedCents)} / ${money(organization.budgetCents)}`} />
        <Metric label="Remaining" value={money(remaining)} />
        <Metric label="Relevant mail" value={String(relevantMail.length)} />
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

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {tab === "overview" ? (
        <div className="space-y-6">
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
        <InboxPanel
          organizationId={organizationId}
          gmail={gmail}
          messages={inboxMessages}
          busy={busy}
          onSync={() => void act(`/api/organizations/${organizationId}/gmail/sync`, "gmail-sync")}
          onDemo={() => void act(`/api/organizations/${organizationId}/gmail/demo`, "gmail-demo")}
          onDisconnect={() => void act(`/api/organizations/${organizationId}/gmail/disconnect`, "gmail-disconnect")}
        />
        <HiringShortlistPanel
          organizationId={organizationId}
          goal={organization.goal}
          roles={organization.hiringRoles}
          busy={busy}
          onBusy={setBusy}
          onError={setError}
          onSaved={load}
        />
        <Panel title="Research evidence">
          {evidence.length === 0 && toolMetrics.length === 0 ? (
            <Empty label="Search, GitHub, and calculator results appear during research." />
          ) : (
            <div className="space-y-4">
              {toolMetrics.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {toolMetrics.map((metric, index) => (
                    <li
                      key={`${metric.source}-${index}`}
                      className="rounded-full border border-[#c2b8ff]/30 px-3 py-1 font-mono text-xs text-[#c2b8ff]"
                    >
                      {metric.summary}
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className="space-y-3">
                {evidence.map((item) => (
                  <li key={`${item.source}-${item.url}`} className="text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.source}</p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex min-h-11 items-center text-[#c2b8ff] underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </a>
                    {item.snippet ? <p className="mt-1 text-muted-foreground">{item.snippet}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
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
              {agent.tools.length > 0 ? (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-[#c2b8ff]/80">
                  {agent.tools.join(" · ")}
                </p>
              ) : null}
              <p className="mt-4 text-sm">{agent.lastAction ?? "Waiting for a task"}</p>
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
                    <td className="px-4 py-3 font-mono tabular-nums">{task.evaluation?.score ?? "-"}</td>
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
          {mediaJobs.some((job) => job.status === "queued" || job.status === "processing") ? (
            <p className="text-sm text-[#c2b8ff]">Higgsfield is still rendering a preview.</p>
          ) : null}
          {contentItems.map((item) => {
            const media = item.mediaAssetIds.map((id) => assetsById.get(id)).filter((asset): asset is Asset => Boolean(asset));
            const job = mediaJobs.find((entry) => entry.contentItemId === item.id);
            return (
            <article key={item.id} className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.platform}</p>
                  <h3 className="mt-1 font-medium">{item.title}</h3>
                </div>
                <StatusBadge value={item.status} tone={toneForStatus(item.status)} />
              </div>
              {media[0] ? (
                <MediaPreview asset={media[0]} kind={item.type} />
              ) : job ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Media {job.status}
                  {job.error ? `: ${job.error}` : ""}
                </p>
              ) : null}
              <p className="mt-3 text-sm">{item.hook}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.caption}</p>
              {item.hashtags.length > 0 ? (
                <p className="mt-2 text-xs text-[#c2b8ff]">{item.hashtags.join(" ")}</p>
              ) : null}
              {item.claimsUsed.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">Claims: {item.claimsUsed.join(" · ")}</p>
              ) : null}
              {item.demoPublished ? (
                <p className="mt-3 text-xs text-accent">Demo mode: publishing simulated</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === item.id || item.status === "approved" || item.status === "published" || item.status === "scheduled"}
                  className="min-h-11 rounded-lg bg-secondary px-4 text-sm focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  onClick={() => void act(`/api/content/items/${item.id}/approve`, item.id)}
                >
                  {busy === item.id ? "Approving…" : item.status === "approved" ? "Approved" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy) || item.status === "published"}
                  className="min-h-11 rounded-lg bg-secondary px-4 text-sm focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  onClick={() => void act(`/api/content/items/${item.id}/reject`, `${item.id}-r`)}
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy) || item.status === "published"}
                  className="min-h-11 rounded-lg bg-secondary px-4 text-sm focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  onClick={() => void act(`/api/content/items/${item.id}/regenerate`, `${item.id}-g`)}
                >
                  {busy === `${item.id}-g` ? "Regenerating…" : "Regenerate"}
                </button>
                <button
                  type="button"
                  disabled={busy === `${item.id}-p` || item.status === "published" || (item.status !== "approved" && item.status !== "scheduled")}
                  className="min-h-11 rounded-lg bg-primary px-4 text-sm text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  onClick={() => void act(`/api/content/items/${item.id}/publish`, `${item.id}-p`)}
                >
                  {busy === `${item.id}-p` ? "Publishing…" : item.status === "published" ? "Published" : "Publish"}
                </button>
              </div>
            </article>
            );
          })}
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

function Panel({ title, children, action }: { title: string; children: import("react").ReactNode; action?: import("react").ReactNode }) {
  return (
    <section className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function HiringShortlistPanel({
  organizationId,
  goal,
  roles,
  busy,
  onBusy,
  onError,
  onSaved,
}: {
  organizationId: string;
  goal: string;
  roles: string[];
  busy: string | null;
  onBusy: (value: string | null) => void;
  onError: (value: string | null) => void;
  onSaved: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(roles.length > 0);
  const [selected, setSelected] = useState<string[]>(roles);

  useEffect(() => {
    setSelected(roles);
    if (roles.length > 0) setOpen(true);
  }, [roles]);

  function toggle(role: string) {
    setSelected((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  async function save() {
    onBusy("hiring-roles");
    onError(null);
    const response = await fetch(`/api/organizations/${organizationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hiringRoles: selected }),
    });
    const data = await response.json().catch(() => ({}));
    await onSaved();
    if (!response.ok) {
      onError(typeof data.error === "string" ? data.error : "Could not save hiring roles");
    }
    onBusy(null);
  }

  return (
    <Panel
      title="Hiring shortlist"
      action={
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-h-11 rounded-[5px] border border-[#c2b8ff] px-3 text-xs text-[#c2b8ff] focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
        >
          {open ? "Hide" : roles.length ? "Edit" : "Set roles"}
        </button>
      }
    >
      {roles.length === 0 && !open ? (
        <Empty label="Optional. Pick roles later if you want Rivera to source candidates." />
      ) : null}
      {open ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Rivera leaves this off until you choose. Suggested from the brief if you want a starting point.
          </p>
          <div className="flex flex-wrap gap-2">
            {HIRING_ROLE_PRESETS.map((role) => {
              const active = selected.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(role)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]",
                    active
                      ? "border-[#c2b8ff] bg-[rgba(194,184,255,0.15)] text-[#f4f2f0]"
                      : "border-white/15 text-[#c2b8ff] hover:border-[#c2b8ff]",
                  )}
                >
                  {role}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelected(suggestHiringRoles(goal))}
              className="min-h-11 rounded-[5px] border border-white/15 px-3 text-xs text-[#928c97] focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
            >
              Suggest from brief
            </button>
            <button
              type="button"
              disabled={busy === "hiring-roles"}
              onClick={() => void save()}
              className="min-h-11 rounded-[5px] bg-white px-3 text-xs text-[#221d2a] focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60"
            >
              {busy === "hiring-roles" ? "Saving…" : "Save roles"}
            </button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function InboxPanel({
  organizationId,
  gmail,
  messages,
  busy,
  onSync,
  onDemo,
  onDisconnect,
}: {
  organizationId: string;
  gmail: OrganizationSnapshot["gmail"];
  messages: OrganizationSnapshot["inboxMessages"];
  busy: string | null;
  onSync: () => void;
  onDemo: () => void;
  onDisconnect: () => void;
}) {
  const relevant = messages.filter((item) => item.relevant);
  const action = gmail.connected ? (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy === "gmail-sync"}
        onClick={onSync}
        className="inline-flex min-h-11 items-center rounded-[5px] border border-[#c2b8ff] px-3 text-xs text-[#c2b8ff] focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60"
      >
        {busy === "gmail-sync" ? "Scanning…" : "Scan inbox"}
      </button>
      <button
        type="button"
        disabled={busy === "gmail-disconnect"}
        onClick={onDisconnect}
        className="inline-flex min-h-11 items-center rounded-[5px] px-3 text-xs text-[#928c97] focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60"
      >
        Disconnect
      </button>
    </div>
  ) : (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/api/organizations/${organizationId}/gmail/connect`}
        className="inline-flex min-h-11 items-center rounded-[5px] border border-white bg-white px-3 text-xs text-[#221d2a] focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
      >
        Connect Google account
      </a>
      <button
        type="button"
        disabled={busy === "gmail-demo"}
        onClick={onDemo}
        className="inline-flex min-h-11 items-center rounded-[5px] border border-[#c2b8ff] px-3 text-xs text-[#c2b8ff] focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60"
      >
        {busy === "gmail-demo" ? "Loading…" : "Preview sample inbox"}
      </button>
    </div>
  );

  return (
    <Panel
      title={gmail.connected ? `Inbox · ${gmail.email}` : "Inbox"}
      action={action}
    >
      {!gmail.connected && messages.length === 0 ? (
        <Empty label="Connect Google to scan Gmail for demand, hiring replies, and other launch-relevant mail." />
      ) : null}
      {gmail.connected && relevant.length === 0 && messages.length === 0 ? (
        <Empty label="Gmail is connected. Scan the inbox to surface launch-relevant mail." />
      ) : null}
      {relevant.length === 0 && messages.length > 0 ? (
        <Empty label="Scanned the inbox. Nothing looked relevant to this launch." />
      ) : null}
      {relevant.length > 0 ? (
        <ul className="space-y-4">
          {relevant.map((item) => (
            <li key={item.id} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm text-[#f4f2f0]">{item.subject}</p>
                <StatusBadge value={`${Math.round(item.relevanceScore * 100)}% match`} tone="good" />
              </div>
              <p className="mt-1 text-xs text-[#928c97]">{item.from}</p>
              {item.snippet ? <p className="mt-2 text-sm text-muted-foreground">{item.snippet}</p> : null}
              <p className="mt-2 text-xs text-[#c2b8ff]">{item.relevanceReason}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}

function MediaPreview({ asset, kind }: { asset: Asset; kind: string }) {
  const src = asset.previewUrl ?? asset.url;
  const videoFile = /\.(mp4|webm|mov)(\?|$)/i.test(asset.url);
  return (
    <figure className="mt-4 overflow-hidden rounded-[8px] border border-white/10">
      {kind === "video" && videoFile ? (
        <video src={asset.url} poster={asset.previewUrl} controls className="max-h-64 w-full bg-black object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="max-h-64 w-full object-cover" />
      )}
      <figcaption className="px-3 py-2 text-xs text-muted-foreground">
        {kind === "video" ? "Higgsfield video preview" : "Higgsfield still"}
        {asset.provider ? ` · ${asset.provider}` : ""}
      </figcaption>
    </figure>
  );
}
