"use client";

/* ─────────────────────────────────────────────────────────
 * PAGE CONTENT STORYBOARD
 *
 * Static chrome (site header, tab bar) never re-animates.
 * Snapshot polls every 2s — only first paint is choreographed.
 *
 *    0ms   header + primary actions visible
 *  120ms   status strip slides up
 *  280ms   tab panels fade in
 * ───────────────────────────────────────────────────────── */

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LaunchTab } from "@/components/dashboard/launch-tab";
import { NowTab } from "@/components/dashboard/now-tab";
import { type DashCtx } from "@/components/dashboard/shared";
import { WorkTab } from "@/components/dashboard/work-tab";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/cn";
import {
  DASHBOARD_TABS,
  PHASE_STEPS,
  attentionCount,
  deadlineLabel,
  parseDashboardHash,
  phaseStepIndex,
  resolveDashboard,
  type DashboardEntry,
  type DashboardTab,
} from "@/lib/dashboard";
import { money, phaseLabel } from "@/lib/format";
import type { OrganizationSnapshot } from "@/types";

export type { DashboardEntry, DashboardTab };

const launchingOrgs = new Set<string>();

const TIMING = {
  header: 0,
  status: 0.12,
  tabs: 0.22,
};

const ENTER = {
  offsetY: 10,
  spring: { type: "spring" as const, stiffness: 350, damping: 30 },
};

const TAB_META: Record<DashboardTab, { label: string; hint: string }> = {
  now: { label: "Now", hint: "Status, your queue, live team" },
  work: { label: "Work", hint: "Tasks, research, log" },
  launch: { label: "Launch", hint: "Posts, code, report" },
};

export function OrgDashboard({
  organizationId,
  initialTab = "now",
  initialSnapshot = null,
}: {
  organizationId: string;
  initialTab?: DashboardEntry;
  initialSnapshot?: OrganizationSnapshot | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const resolved = resolveDashboard(initialTab);
  const [snapshot, setSnapshot] = useState<OrganizationSnapshot | null>(initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DashboardTab>(resolved.tab);
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

  useEffect(() => {
    const fromHash = parseDashboardHash(window.location.hash);
    if (fromHash) {
      setTab(fromHash.tab);
      const hashFocus = fromHash.focus;
      if (hashFocus) window.setTimeout(() => scrollToId(hashFocus), 80);
      return;
    }
    const entryFocus = resolved.focus;
    if (entryFocus) window.setTimeout(() => scrollToId(entryFocus), 80);
  }, [organizationId, resolved.focus]);

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

  const orgHref = `/organizations/${organizationId}`;

  function goTo(next: DashboardTab, focus?: string) {
    setTab(next);
    const hash = focus ?? (next === "now" ? "" : next);
    router.replace(hash ? `${orgHref}#${hash}` : orgHref, { scroll: false });
    if (focus) window.setTimeout(() => scrollToId(focus), 120);
  }

  const ctx: DashCtx | null = snapshot
    ? {
        organizationId,
        snapshot,
        busy,
        act,
        load,
        setBusy,
        setError,
        goTo,
      }
    : null;

  const pendingCount = snapshot ? attentionCount(snapshot) : 0;

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

  if (!snapshot || !ctx) {
    return <DashboardSkeleton />;
  }

  const { organization, run } = snapshot;
  const remaining = organization.budgetCents - organization.budgetUsedCents;
  const usedPct =
    organization.budgetCents === 0 ? 0 : Math.min(100, (organization.budgetUsedCents / organization.budgetCents) * 100);
  const stepIndex = phaseStepIndex(run?.status);
  const failed = run?.status === "failed" || run?.status === "cancelled";
  const motionOff = Boolean(reduce);

  return (
    <div className="space-y-6">
      <motion.header
        initial={motionOff ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ENTER.spring}
        className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between"
      >
        <div className="min-w-0">
          <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Organization</p>
          <h1 className="mt-1 text-[36px] font-normal leading-[44px] tracking-[-1.2px] text-[#f4f2f0] md:text-[42px] md:leading-[50px]">
            {organization.name}
          </h1>
          <p className="mt-2 max-w-2xl text-[16px] leading-[26px] text-[#928c97]">{organization.goal}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={phaseLabel(run?.status)} tone={failed ? "bad" : "live"} />
          {run?.demoMode ? <StatusBadge value="Demo mode" tone="warn" /> : run ? <StatusBadge value="Live providers" tone="good" /> : null}
          {busy === "start-run" ? <StatusBadge value="Launching agents" tone="live" /> : null}
          {!run && busy !== "start-run" ? (
            <button
              type="button"
              onClick={() => void act(`/api/organizations/${organizationId}/runs`, "start-run")}
              className="inline-flex min-h-11 items-center rounded-[5px] border border-white bg-white px-4 text-sm text-[#221d2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
            >
              Launch agents
            </button>
          ) : null}
        </div>
      </motion.header>

      <motion.div
        initial={motionOff ? false : { opacity: 0, y: ENTER.offsetY }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...ENTER.spring, delay: TIMING.status }}
        className="space-y-4"
      >
        <PhaseRail active={stepIndex} failed={failed} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Budget"
            value={`${money(organization.budgetUsedCents)} of ${money(organization.budgetCents)}`}
            detail={
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#c2b8ff]" style={{ width: `${usedPct}%` }} />
              </div>
            }
          />
          <Stat label="Remaining" value={money(remaining)} detail={<p className="mt-2 text-xs text-[#928c97]">{deadlineLabel(organization.deadline)}</p>} />
          <Stat
            label="Waiting on you"
            value={pendingCount === 0 ? "None" : String(pendingCount)}
            detail={
              <p className="mt-2 text-xs text-[#928c97]">
                {pendingCount === 0 ? "Approve only when something is ready." : "Open Now to clear the queue."}
              </p>
            }
          />
        </div>
      </motion.div>

      <div className="sticky top-0 z-20 -mx-2 bg-[#0c0a10]/85 px-2 py-3 backdrop-blur-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div
            role="tablist"
            aria-label="Organization views"
            className="inline-flex w-full rounded-[5px] border border-[#c2b8ff]/35 p-1 md:w-auto"
          >
            {DASHBOARD_TABS.map((id, index) => {
              const selected = tab === id;
              const count = id === "now" && pendingCount > 0 ? pendingCount : 0;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${id}`}
                  onClick={() => goTo(id)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                    event.preventDefault();
                    const dir = event.key === "ArrowRight" ? 1 : -1;
                    const next = DASHBOARD_TABS[(index + dir + DASHBOARD_TABS.length) % DASHBOARD_TABS.length];
                    goTo(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }}
                  className={cn(
                    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[4px] px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff] md:flex-none md:px-6",
                    selected ? "bg-white text-[#221d2a]" : "text-[#c2b8ff] hover:bg-white/5",
                  )}
                >
                  {TAB_META[id].label}
                  {count > 0 ? (
                    <span className={cn("rounded-full px-1.5 font-mono text-[11px] tabular-nums", selected ? "bg-[#221d2a] text-white" : "bg-[#c2b8ff] text-[#221d2a]")}>
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="px-1 text-xs text-[#928c97]">{TAB_META[tab].hint}</p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <motion.div
        initial={motionOff ? false : { opacity: 0, y: ENTER.offsetY }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...ENTER.spring, delay: TIMING.tabs }}
      >
        <div role="tabpanel" id="panel-now" aria-labelledby="tab-now" hidden={tab !== "now"}>
          <NowTab ctx={ctx} />
        </div>
        <div role="tabpanel" id="panel-work" aria-labelledby="tab-work" hidden={tab !== "work"}>
          <WorkTab ctx={ctx} />
        </div>
        <div role="tabpanel" id="panel-launch" aria-labelledby="tab-launch" hidden={tab !== "launch"}>
          <LaunchTab ctx={ctx} />
        </div>
      </motion.div>
    </div>
  );
}

function PhaseRail({ active, failed }: { active: number; failed: boolean }) {
  return (
    <ol className="flex items-center gap-0 overflow-x-auto pb-1" aria-label="Run phases">
      {PHASE_STEPS.map((step, index) => {
        const done = !failed && active > index;
        const current = !failed && active === index;
        return (
          <li key={step.key} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  failed && current ? "bg-destructive" : current ? "bg-[#c2b8ff]" : done ? "bg-[#f4f2f0]" : "bg-white/20",
                )}
              />
              <span
                className={cn(
                  "truncate text-xs tracking-[0.04em]",
                  current ? "text-[#c2b8ff]" : done ? "text-[#f4f2f0]" : "text-[#928c97]",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < PHASE_STEPS.length - 1 ? <span className="mx-3 h-px flex-1 bg-white/10" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: import("react").ReactNode }) {
  return (
    <div className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-4">
      <p className="text-[11px] uppercase tracking-[0.06em] text-[#928c97]">{label}</p>
      <p className="mt-2 font-mono text-lg tabular-nums text-[#f4f2f0]">{value}</p>
      {detail}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-40 animate-pulse rounded-[10px] bg-[#1f1c26]" />
      <div className="h-14 w-2/3 animate-pulse rounded-[10px] bg-[#1f1c26]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-[10px] bg-[#1f1c26]" />
        ))}
      </div>
      <div className="h-12 w-80 animate-pulse rounded-[5px] bg-[#1f1c26]" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[10px] bg-[#1f1c26]" />
        ))}
      </div>
    </div>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
