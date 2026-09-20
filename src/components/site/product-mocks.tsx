"use client";

import Link from "next/link";
import { Show, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { RiveraMark } from "@/components/site/rivera-mark";
import type { HomeOverview } from "@/lib/home/overview";

export function HeroDashboard() {
  return (
    <>
      <Show when="signed-out">
        <DashboardCard view={STOCK_VIEW} />
      </Show>
      <Show when="signed-in">
        <LiveHeroDashboard />
      </Show>
    </>
  );
}

function LiveHeroDashboard() {
  const { user } = useUser();
  const [overview, setOverview] = useState<HomeOverview | null>(null);
  const [orgId, setOrgId] = useState<string | undefined>();

  async function load(nextOrgId?: string) {
    const query = nextOrgId ? `?orgId=${encodeURIComponent(nextOrgId)}` : "";
    const response = await fetch(`/api/home/overview${query}`, { cache: "no-store" });
    const data = (await response.json()) as HomeOverview;
    setOverview(data);
    if (data.selected?.id) setOrgId(data.selected.id);
  }

  useEffect(() => {
    void load(orgId);
    const timer = window.setInterval(() => void load(orgId), 4000);
    return () => window.clearInterval(timer);
  }, [orgId]);

  const initial =
    user?.firstName?.[0] ||
    user?.username?.[0] ||
    user?.primaryEmailAddress?.emailAddress?.[0] ||
    "R";

  if (!overview) {
    return (
      <DashboardCard
        view={{
          orgSlug: "loading",
          orgName: "Loading organization",
          initial: initial.toUpperCase(),
          orgHref: "#intake",
          metrics: { tasksThisWeek: "—", successRate: "—", avgRunTime: "—" },
          agents: [],
          runs: [],
          agentNames: [],
        }}
        loading
      />
    );
  }

  return (
    <DashboardCard
      view={viewFromOverview(overview, initial.toUpperCase())}
      onSelectOrg={(id) => {
        setOrgId(id);
        void load(id);
      }}
    />
  );
}

function viewFromOverview(overview: HomeOverview, initial: string): DashboardView {
  const selected = overview.selected;
  if (!selected) {
    return {
      orgSlug: "no-org",
      orgName: "Create an org",
      initial,
      orgHref: "#intake",
      metrics: {
        tasksThisWeek: "0",
        successRate: "—",
        avgRunTime: "—",
      },
      agents: [],
      runs: [],
      agentNames: [],
      organizations: overview.organizations,
      selectedId: undefined,
      emptyLabel: "Start a run above. Agents, tasks, and live stats will land here.",
    };
  }
  return {
    orgSlug: selected.slug,
    orgName: `${selected.slug} / ${selected.phase}`,
    initial,
    orgHref: `/organizations/${selected.id}`,
    metrics: {
      tasksThisWeek: String(selected.metrics.tasksThisWeek),
      successRate: selected.metrics.taskSuccessRate,
      avgRunTime: selected.metrics.avgRunTime,
    },
    agents: selected.agents,
    runs: selected.runs,
    agentNames: selected.agentNames.slice(0, 4),
    organizations: overview.organizations,
    selectedId: selected.id,
  };
}

type DashboardView = {
  orgSlug: string;
  orgName: string;
  initial: string;
  orgHref: string;
  metrics: { tasksThisWeek: string; successRate: string; avgRunTime: string; deltas?: [string, string, string] };
  agents: Array<{ id?: string; name: string; status: string; when: string; detail: string }>;
  runs: Array<{ id?: string; href: string; title: string; extra: string; status: string; when: string; detail: string }>;
  agentNames: string[];
  organizations?: Array<{ id: string; name: string; slug: string }>;
  selectedId?: string;
  emptyLabel?: string;
};

const STOCK_VIEW: DashboardView = {
  orgSlug: "rivera-org",
  orgName: "rivera / launch-org",
  initial: "R",
  orgHref: "#intake",
  metrics: {
    tasksThisWeek: "21",
    successRate: "81%",
    avgRunTime: "9m 21s",
    deltas: ["+3%", "+16%", "+5%"],
  },
  agents: [
    { name: "CEO", status: "Successful", when: "12m ago", detail: "plan" },
    { name: "Research", status: "Successful", when: "12m ago", detail: "market-map" },
  ],
  runs: [
    { href: "#intake", title: "research / market-map", extra: "main", status: "Successful", when: "12m ago", detail: "preview" },
    { href: "#intake", title: "social / launch-review", extra: "campaign", status: "Successful", when: "12m ago", detail: "preview" },
  ],
  agentNames: ["ceo", "research"],
};

function DashboardCard({
  view,
  loading = false,
  onSelectOrg,
}: {
  view: DashboardView;
  loading?: boolean;
  onSelectOrg?: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-[#0e0c12] px-8 py-7 shadow-[0px_0px_16px_4px_rgba(194,184,255,0.08)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RiveraMark compact />
          {view.organizations && view.organizations.length > 0 ? (
            <label className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[12px] text-[#f4f2f0]">
              <span className="size-2 rounded-full bg-[#6a53fe]" />
              <select
                value={view.selectedId ?? view.organizations[0]?.id}
                onChange={(event) => onSelectOrg?.(event.target.value)}
                className="max-w-[180px] bg-transparent text-[12px] text-[#f4f2f0] outline-none"
                aria-label="Organization"
              >
                {view.organizations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-[#0e0c12] text-[#f4f2f0]">
                    {org.slug}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[12px] text-[#f4f2f0]">
              <span className="size-2 rounded-full bg-[#6a53fe]" />
              {view.orgSlug}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[13px] text-[#928c97]">
          Docs
          <span className="flex size-7 items-center justify-center rounded-full bg-[#c2b8ff] text-[11px] font-medium text-[#221d2a]">
            {view.initial}
          </span>
        </div>
      </div>

      <div className="mt-6 flex gap-6 border-b border-white/8 text-[13px] text-[#928c97]">
        {["Overview", "Review", "Production", "Agents", "Settings"].map((tab, index) => (
          <span
            key={tab}
            className={index === 0 ? "-mb-px border-b border-[#f4f2f0] pb-3 text-[#f4f2f0]" : "pb-3"}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className={`mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] ${loading ? "animate-pulse" : ""}`}>
        <div>
          <h3 className="text-[40px] font-normal leading-none tracking-[-1.2px] text-[#f4f2f0]">Overview</h3>
          <div className="mt-8 grid grid-cols-3 gap-8 text-[13px] text-[#928c97]">
            <Metric label="Tasks this week" value={view.metrics.tasksThisWeek} delta={view.metrics.deltas?.[0]} />
            <Metric label="Task success rate" value={view.metrics.successRate} delta={view.metrics.deltas?.[1]} />
            <Metric label="Avg. run time" value={view.metrics.avgRunTime} delta={view.metrics.deltas?.[2]} down={Boolean(view.metrics.deltas)} />
          </div>

          <SectionTitle>Starred agents</SectionTitle>
          {view.agents.length === 0 ? (
            <p className="py-3 text-[13px] text-[#928c97]">{view.emptyLabel ?? "No agents yet. Launch a run to staff the org."}</p>
          ) : (
            <div className="divide-y divide-white/6">
              {view.agents.map((agent) => (
                <AgentRow
                  key={agent.id ?? agent.name}
                  name={agent.name}
                  status={agent.status}
                  when={agent.when}
                  detail={agent.detail}
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <SectionTitle className="mt-0">Live runs</SectionTitle>
            <Link href={view.orgHref} className="text-[13px] text-[#928c97]">
              {view.selectedId ? "Open org →" : "Start a run →"}
            </Link>
          </div>
          {view.runs.length === 0 ? (
            <p className="py-3 text-[13px] text-[#928c97]">No runs yet.</p>
          ) : (
            <div className="divide-y divide-white/6">
              {view.runs.map((run) => (
                <RunRow
                  key={run.id ?? run.title}
                  href={run.href}
                  title={run.title}
                  extra={run.extra}
                  status={run.status}
                  when={run.when}
                  detail={run.detail}
                />
              ))}
            </div>
          )}
        </div>

        <aside>
          <div className="flex h-[148px] items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#3b2f78_0%,#6a53fe_45%,#c2b8ff_100%)]">
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 text-[#f4f2f0]">
              <Sparkle />
              <Sparkle color="#7ee0ff" />
              <Sparkle />
              <Sparkle color="#7ee0ff" />
              <Sparkle />
              <Sparkle color="#7ee0ff" />
            </div>
          </div>
          <p className="mt-6 text-[11px] tracking-[0.14em] text-[#928c97]">ORGANIZATION</p>
          <p className="mt-2 text-[13px] text-[#f4f2f0]">{view.orgName}</p>
          <p className="mt-6 text-[11px] tracking-[0.14em] text-[#928c97]">AGENTS</p>
          {view.agentNames.length === 0 ? (
            <p className="mt-2 text-[13px] text-[#928c97]">—</p>
          ) : (
            view.agentNames.map((name) => (
              <p key={name} className="mt-1 text-[13px] text-[#f4f2f0] first:mt-2">
                {name}
              </p>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}

export function FeaturePreviewComment() {
  return (
    <div className="rounded-[10px] bg-[#121018] p-5">
      <div className="flex items-center gap-2 text-[13px]">
        <RiveraMark compact />
        <span className="rounded-full border border-white/15 px-1.5 text-[10px] text-[#928c97]">bot</span>
        <span className="text-[#928c97]">commented now</span>
      </div>
      <p className="mt-5 text-[13px] text-[#928c97]">Your research is live at:</p>
      <p className="mt-1 text-[13px] text-[#c2b8ff]">https://run.rivera.dev/research-plan</p>
      <p className="mt-5 text-[13px] text-[#f4f2f0]">Last completed tasks:</p>
      <ul className="mt-2 space-y-1.5 text-[13px] text-[#f4f2f0]">
        <li>✓ Research brief</li>
        <li>✓ Strategy memo</li>
      </ul>
    </div>
  );
}

export function FeaturePreviewPlan() {
  return (
    <div className="rounded-[10px] bg-[#0b0a0f] p-5 font-mono text-[12px] leading-6">
      <p className="flex items-center gap-2 text-[#7dcea0]">
        <span className="size-1.5 rounded-full bg-[#7dcea0]" />
        Successful after 43s (15 min ago)
      </p>
      <p className="mt-4 tracking-[0.16em] text-[#928c97]">ENVIRONMENT</p>
      <p className="text-[#7dcea0]">+ ceo-plan</p>
      <p className="mt-3 tracking-[0.16em] text-[#928c97]">RESOURCES</p>
      <p className="text-[#7dcea0]">+ research-agent : market-map</p>
      <p className="text-[#7dcea0]">+ strategy-agent : positioning</p>
      <p className="text-[#7dcea0]">+ finance-agent : budget-cap</p>
      <p className="text-[#7dcea0]">+ evaluator : scorecard</p>
    </div>
  );
}

export function FeaturePreviewPipeline() {
  return (
    <div className="overflow-hidden rounded-[10px] bg-[#121018] text-[13px]">
      <Row ok label="RESEARCH" detail="complete in 23s" />
      <Row ok label="DEBATE" detail="complete in 2m 3s" />
      <div className="border-t border-white/6 px-4 py-3">
        <p className="text-[#f4f2f0]">● APPROVAL 15s</p>
        <div className="mt-2 space-y-1 pl-4 text-[#928c97]">
          <p>✓ marketing 15s · Logs</p>
          <p>○ engineering 15s · Logs</p>
        </div>
      </div>
    </div>
  );
}

export function FeaturePreviewPromote() {
  return (
    <div className="relative rounded-[10px] bg-[#121018] p-5">
      <div className="absolute right-5 top-5 w-[168px] overflow-hidden rounded-[10px] bg-[#1b1822] text-[13px] shadow-lg">
        <div className="bg-white px-3 py-2 text-[#221d2a]">Approve publish</div>
        <div className="px-3 py-2 text-[#f4f2f0]">Request changes</div>
      </div>
      <div className="mt-16 flex items-center justify-between text-[13px]">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-2.5 py-1 text-[#f4f2f0]">
          <span className="size-2 rounded-full bg-[#d6e36a]" />
          Reviewed · 9dsad3e
        </span>
        <span className="text-[#928c97]">6m ago</span>
      </div>
      <div className="mt-6 space-y-2 text-[13px] text-[#928c97]">
        <p>complete in 23s</p>
        <p>complete in 3m 12s</p>
      </div>
    </div>
  );
}

export function FeaturePreviewEditor() {
  return (
    <div className="grid min-h-[280px] grid-cols-[160px_minmax(0,1fr)] overflow-hidden rounded-[10px] bg-[#0b0a0f] text-[12px]">
      <aside className="border-r border-white/8 p-3 text-[#928c97]">
        <p className="mb-2 tracking-[0.14em] text-[#6a6a72]">EXPLORER</p>
        <p>goal.md</p>
        <p>agents.ts</p>
        <p className="text-[#f4f2f0]">report.md</p>
        <p>approvals.ts</p>
        <p>campaign.ts</p>
      </aside>
      <div className="p-4 font-mono leading-6 text-[#c8c2d4]">
        <div className="mb-3 flex items-center justify-between text-[#928c97]">
          <span>report.md</span>
          <span className="text-[#7dcea0]">● Running</span>
        </div>
        <p>
          <span className="text-[#6a6a72]">1</span> # Rivera recommendation
        </p>
        <p>
          <span className="text-[#6a6a72]">2</span> opportunity: <span className="text-[#c2b8ff]">strong</span>
        </p>
        <p>
          <span className="text-[#6a6a72]">3</span> publish: <span className="text-[#c2b8ff]">awaiting approval</span>
        </p>
        <p>
          <span className="text-[#6a6a72]">4</span> next: review captions
        </p>
      </div>
    </div>
  );
}

export function LaunchTimeline() {
  const months = ["Intake", "Research", "Plan", "Review", "Launch"];
  const rows = [
    {
      label: "Research",
      chips: [
        { label: "Market map", col: 1 },
        { label: "Competitor notes", col: 3 },
        { label: "Brief", col: 4 },
      ],
    },
    {
      label: "Planning",
      chips: [
        { label: "CEO plan", col: 1 },
        { label: "Tasks", col: 2 },
        { label: "Budget gate", col: 4 },
      ],
    },
    {
      label: "Approvals",
      chips: [
        { label: "Debate", col: 2 },
        { label: "Human review", col: 3 },
      ],
    },
    {
      label: "Campaign",
      chips: [
        { label: "Captions", col: 3 },
        { label: "Media review", col: 4 },
      ],
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[12px] bg-[#0e0c12] px-6 py-8">
      <div className="grid grid-cols-[140px_repeat(5,minmax(0,1fr))] gap-y-3 text-[12px] text-[#928c97]">
        <div />
        {months.map((month) => (
          <div key={month} className="text-center tracking-[0.12em]">
            {month.toUpperCase()}
          </div>
        ))}
        {rows.map((row) => (
          <div key={row.label} className="col-span-6 grid grid-cols-subgrid items-center py-2">
            <div className="text-[14px] text-[#f4f2f0]">{row.label}</div>
            <div className="relative col-span-5 h-10">
              {row.chips.map((chip) => (
                <span
                  key={chip.label}
                  className="absolute top-1 rounded-full border border-white/10 bg-[#16131c] px-3 py-1.5 text-[12px] text-[#d8d4de]"
                  style={{ left: `${(chip.col - 1) * 20 + 2}%` }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute left-[42%] top-[28%] rotate-[-8deg] rounded-[6px] bg-[#e8ff8a] px-4 py-3 text-[18px] leading-6 text-[#221d2a] shadow-lg">
        1,000+ founder hours of
        <br />
        undifferentiated work
      </div>
      <div className="pointer-events-none absolute left-[48%] top-[58%] rotate-[4deg] rounded-[6px] bg-[#c2b8ff] px-4 py-3 text-[18px] leading-6 text-[#221d2a] shadow-lg">
        Vs. spending time on
        <br />
        your actual product
      </div>

      <div className="relative mt-8 flex h-10 items-center overflow-hidden rounded-full bg-[#16131c] text-[13px]">
        <span className="flex h-full items-center bg-[#c2b8ff] px-4 text-[#221d2a]">Make your product great</span>
        <span className="flex h-full items-center px-4 text-[#f4f2f0]">Get Rivera</span>
        <span className="ml-auto pr-6 text-[#c2b8ff]">✦ ✦ ✦</span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  down = false,
}: {
  label: string;
  value: string;
  delta?: string;
  down?: boolean;
}) {
  return (
    <div>
      <p>{label}</p>
      <p className="mt-2 text-[28px] leading-none tracking-[-0.6px] text-[#f4f2f0]">
        {value}{" "}
        {delta ? <span className={`text-[13px] ${down ? "text-[#e08a7d]" : "text-[#7dcea0]"}`}>{delta}</span> : null}
      </p>
    </div>
  );
}

function SectionTitle({ children, className = "mt-10" }: { children: string; className?: string }) {
  return <p className={`mb-3 text-[16px] text-[#f4f2f0] ${className}`}>{children}</p>;
}

function AgentRow({
  name,
  status,
  when,
  detail,
}: {
  name: string;
  status: string;
  when: string;
  detail: string;
}) {
  const failed = status === "Failed";
  return (
    <div className="flex items-center justify-between py-3 text-[13px]">
      <span className="flex items-center gap-3 text-[#f4f2f0]">
        <span className="text-[#928c97]">⊞</span>
        {name} <span className="text-[#c2b8ff]">✦</span>
      </span>
      <span className="flex items-center gap-6 text-[#928c97]">
        <span className="flex items-center gap-2 text-[#f4f2f0]">
          <span className={`size-1.5 rounded-full ${failed ? "bg-[#e08a7d]" : "bg-[#7dcea0]"}`} />
          {status} {when}
        </span>
        <span className="max-w-[180px] truncate">{detail}</span>
      </span>
    </div>
  );
}

function RunRow({
  href,
  title,
  extra,
  status,
  when,
  detail,
}: {
  href: string;
  title: string;
  extra: string;
  status: string;
  when: string;
  detail: string;
}) {
  const failed = status === "Failed";
  return (
    <Link href={href} className="flex items-center justify-between py-3 text-[13px]">
      <span>
        <span className="text-[#f4f2f0]">{title} ↗</span>
        <span className="mt-1 block text-[#928c97]">{extra}</span>
      </span>
      <span className="flex items-center gap-6 text-[#928c97]">
        <span className="flex items-center gap-2 text-[#f4f2f0]">
          <span className={`size-1.5 rounded-full ${failed ? "bg-[#e08a7d]" : "bg-[#7dcea0]"}`} />
          {status} {when}
        </span>
        <span>{detail}</span>
      </span>
    </Link>
  );
}

function Sparkle({ color = "#f4f2f0" }: { color?: string }) {
  return (
    <span className="text-[18px] leading-none" style={{ color }}>
      ✦
    </span>
  );
}

function Row({ ok, label, detail }: { ok?: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between border-t border-white/6 px-4 py-3 first:border-t-0">
      <span className="text-[#f4f2f0]">
        {ok ? "✓" : "●"} {label}
      </span>
      <span className="text-[#928c97]">{detail}</span>
    </div>
  );
}
