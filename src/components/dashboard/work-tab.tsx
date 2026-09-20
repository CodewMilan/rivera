"use client";

import { Empty, Panel, Surface, TaskStatus, type DashCtx } from "@/components/dashboard/shared";
import { HiringShortlistPanel } from "@/components/dashboard/panels";
import { evidenceFromEvents, toolMetricsFromEvents } from "@/lib/research/evidence";
import { money, shortDate } from "@/lib/format";
import type { Task, TaskStatus as TaskStatusType } from "@/types";

const GROUPS: Array<{ key: string; title: string; statuses: TaskStatusType[]; empty: string }> = [
  {
    key: "attention",
    title: "Needs attention",
    statuses: ["blocked", "approval_required", "review", "failed"],
    empty: "Nothing stuck.",
  },
  {
    key: "doing",
    title: "In progress",
    statuses: ["in_progress"],
    empty: "No one is mid-task.",
  },
  {
    key: "queue",
    title: "Queue",
    statuses: ["todo"],
    empty: "Queue is empty.",
  },
  {
    key: "done",
    title: "Done",
    statuses: ["done"],
    empty: "Nothing finished yet.",
  },
];

export function WorkTab({ ctx }: { ctx: DashCtx }) {
  const { snapshot, organizationId, busy, setBusy, setError, load } = ctx;
  const { organization, tasks, events, agents } = snapshot;
  const evidence = evidenceFromEvents(events);
  const toolMetrics = toolMetricsFromEvents(events);
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const timeline = events.slice().reverse();

  return (
    <div className="space-y-6">
      <div id="tasks" className="scroll-mt-28 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#c2b8ff]">Work</p>
          <h2 className="mt-1 text-[22px] font-normal tracking-[-0.4px] text-[#f4f2f0]">Tasks</h2>
          <p className="mt-1 max-w-prose text-sm leading-6 text-[#928c97]">
            Grouped by what needs a look, what is moving, and what is done. Cost and score sit on each row.
          </p>
        </div>
        {tasks.length === 0 ? (
          <Surface>
            <Empty label="Tasks appear after planning. The CEO is breaking the goal into work." />
          </Surface>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {GROUPS.map((group) => {
              const items = tasks.filter((task) => group.statuses.includes(task.status));
              return (
                <TaskGroup
                  key={group.key}
                  title={group.title}
                  empty={group.empty}
                  tasks={items}
                  agentName={(id) => agentsById.get(id)?.name ?? "Unassigned"}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="research" eyebrow="Evidence" title="Research">
          {evidence.length === 0 && toolMetrics.length === 0 ? (
            <Empty label="Search, GitHub, and calculator results land here during research." />
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
                  <li key={`${item.source}-${item.url}`}>
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[#928c97]">{item.source}</p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex min-h-11 items-center text-sm text-[#c2b8ff] underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </a>
                    {item.snippet ? <p className="mt-1 text-sm leading-6 text-[#928c97]">{item.snippet}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <HiringShortlistPanel
          organizationId={organizationId}
          goal={organization.goal}
          roles={organization.hiringRoles ?? []}
          events={events}
          hiringTask={tasks.find((task) => task.title === "Shortlist hires")}
          busy={busy}
          onBusy={setBusy}
          onError={setError}
          onSaved={load}
        />
      </div>

      <Panel id="timeline" eyebrow="Log" title="Timeline">
        {timeline.length === 0 ? (
          <Empty label="No activity yet." />
        ) : (
          <ol className="relative space-y-0 border-l border-white/10 pl-5">
            {timeline.map((event) => (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[23px] top-1.5 size-2 rounded-full bg-[#c2b8ff]" aria-hidden />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm leading-6 text-[#f4f2f0]">{event.summary}</p>
                  <time className="font-mono text-[11px] text-[#928c97]">{shortDate(event.createdAt)}</time>
                </div>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-[#928c97]">{event.type}</p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

function TaskGroup({
  title,
  empty,
  tasks,
  agentName,
}: {
  title: string;
  empty: string;
  tasks: Task[];
  agentName: (id: string) => string;
}) {
  return (
    <Surface>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-medium text-[#f4f2f0]">{title}</h3>
        <p className="font-mono text-xs tabular-nums text-[#928c97]">{tasks.length}</p>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-[#928c97]">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-[#f4f2f0]">{task.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#928c97]">{task.description}</p>
                  <p className="mt-2 text-[11px] text-[#928c97]">
                    {agentName(task.agentId)}
                    <span className="mx-2 text-white/20">·</span>
                    <span className="font-mono tabular-nums">{money(task.actualCostCents ?? 0)}</span>
                    {task.evaluation?.score != null ? (
                      <>
                        <span className="mx-2 text-white/20">·</span>
                        <span className="font-mono tabular-nums">score {task.evaluation.score}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <TaskStatus status={task.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
