"use client";

import { AgentIcon, Empty, LiveDot, Panel, Surface, btnGhost, btnPrimary, btnQuiet, type DashCtx } from "@/components/dashboard/shared";
import { InboxPanel } from "@/components/dashboard/panels";
import { StatusBadge, toneForStatus } from "@/components/status-badge";
import { AGENT_META, attentionItems } from "@/lib/dashboard";
import { money, shortDate } from "@/lib/format";

export function NowTab({ ctx }: { ctx: DashCtx }) {
  const { snapshot, organizationId, busy, act, goTo } = ctx;
  const { organization, run, agents, events, gmail, inboxMessages } = snapshot;
  const { blocked, pending, review, openDecisions } = attentionItems(snapshot);
  const needsYou = blocked.length + pending.length + review.length + openDecisions.length;
  const recent = events.slice().reverse().slice(0, 6);

  return (
    <div className="space-y-6">
      <Surface className={needsYou > 0 ? "border border-[#c2b8ff]/35" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c2b8ff]">Needs you</p>
            <h2 className="mt-1 text-[22px] font-normal tracking-[-0.4px] text-[#f4f2f0]">
              {needsYou === 0 ? "All clear" : needsYou === 1 ? "1 thing waiting" : `${needsYou} things waiting`}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#928c97]">
              {needsYou === 0
                ? run
                  ? "Rivera is working. You only need to step in for publishes, spend, and open calls."
                  : "Launch the org to staff agents against this goal."
                : "Approve, reject, or unblock — then Rivera continues."}
            </p>
          </div>
          {needsYou > 0 ? (
            <StatusBadge value="Action" tone="live" />
          ) : (
            <StatusBadge value={run ? "Hands-off" : "Not started"} tone={run ? "good" : "muted"} />
          )}
        </div>

        {needsYou === 0 ? null : (
          <ul className="mt-5 space-y-3">
            {pending.map((approval) => (
              <li
                key={approval.id}
                className="flex flex-col gap-3 border-t border-white/10 pt-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-[#f4f2f0]">{approval.summary}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.06em] text-[#928c97]">
                    {approval.actionType.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === `${approval.id}-r`}
                    onClick={() => void act(`/api/approvals/${approval.id}/reject`, `${approval.id}-r`)}
                    className={btnQuiet}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busy === approval.id}
                    onClick={() => void act(`/api/approvals/${approval.id}/approve`, approval.id)}
                    className={btnPrimary}
                  >
                    {busy === approval.id ? "Approving…" : "Approve"}
                  </button>
                </div>
              </li>
            ))}
            {review.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-[#f4f2f0]">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.06em] text-[#928c97]">
                    {item.platform} · {item.status}
                  </p>
                </div>
                <button type="button" onClick={() => goTo("launch", "content")} className={btnGhost}>
                  Review post
                </button>
              </li>
            ))}
            {openDecisions.map((decision) => (
              <li
                key={decision.id}
                className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-[#f4f2f0]">{decision.question}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.06em] text-[#928c97]">Open decision</p>
                </div>
                <button type="button" onClick={() => goTo("launch", "decisions")} className={btnGhost}>
                  Read debate
                </button>
              </li>
            ))}
            {blocked.map((task) => (
              <li key={task.id} className="border-t border-white/10 pt-4">
                <p className="text-sm text-[#f4f2f0]">{task.title}</p>
                <p className="mt-1 text-xs text-[#928c97]">{task.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel
          id="team"
          eyebrow="Live"
          title={agents.length === 0 ? "Team" : `${agents.length} agents`}
          action={
            <button type="button" onClick={() => goTo("work", "tasks")} className={btnQuiet}>
              See tasks
            </button>
          }
        >
          {agents.length === 0 ? (
            <Empty
              label={run ? "CEO is staffing the organization." : "Launch agents to start the Rivera run."}
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {agents.map((agent) => (
                <li key={agent.id} className="rounded-[8px] border border-white/10 bg-[#0c0a10]/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-[#c2b8ff]/10 text-[#c2b8ff]">
                        <AgentIcon type={agent.type} />
                      </span>
                      <div>
                        <p className="text-sm text-[#f4f2f0]">{agent.name}</p>
                        <p className="text-[11px] uppercase tracking-[0.06em] text-[#928c97]">
                          {AGENT_META[agent.type]?.hint ?? agent.type}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5">
                      <LiveDot live={agent.status === "working"} />
                      <StatusBadge value={agent.status} tone={toneForStatus(agent.status)} />
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#928c97]">
                    {agent.lastAction ?? "Waiting for a task"}
                  </p>
                  <p className="mt-2 font-mono text-[11px] tabular-nums text-[#c2b8ff]/80">
                    {money(agent.spentCents)}
                    {agent.confidence != null ? ` · ${Math.round(agent.confidence * 100)}%` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <InboxPanel
            organizationId={organizationId}
            gmail={gmail}
            messages={inboxMessages}
            busy={busy}
            onSync={() => void act(`/api/organizations/${organizationId}/gmail/sync`, "gmail-sync")}
            onDemo={() => void act(`/api/organizations/${organizationId}/gmail/demo`, "gmail-demo")}
            onDisconnect={() => void act(`/api/organizations/${organizationId}/gmail/disconnect`, "gmail-disconnect")}
          />
          <Panel
            title="Latest"
            eyebrow="Activity"
            action={
              <button type="button" onClick={() => goTo("work", "timeline")} className={btnQuiet}>
                Full log
              </button>
            }
          >
            {recent.length === 0 ? (
              <Empty label="Activity appears as soon as the run starts." />
            ) : (
              <ol className="space-y-3">
                {recent.map((event) => (
                  <li key={event.id} className="flex items-baseline justify-between gap-3">
                    <p className="text-sm leading-6 text-[#f4f2f0]">{event.summary}</p>
                    <time className="shrink-0 font-mono text-[11px] text-[#928c97]">{shortDate(event.createdAt)}</time>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
          {(organization.hiringRoles ?? []).length > 0 ? (
            <p className="px-1 text-xs text-[#928c97]">
              Hiring shortlist is on{" "}
              <button type="button" onClick={() => goTo("work", "hiring")} className="text-[#c2b8ff] underline-offset-4 hover:underline">
                Work
              </button>
              .
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
