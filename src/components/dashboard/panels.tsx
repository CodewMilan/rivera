"use client";

import { useEffect, useState } from "react";
import { Empty, Panel, btnGhost, btnPrimary, btnQuiet } from "@/components/dashboard/shared";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/cn";
import { HIRING_ROLE_PRESETS, suggestHiringRoles } from "@/lib/intake/roles";
import {
  hiringCandidatesFromEvents,
  hiringCandidatesFromTask,
  mergeHiringCandidates,
} from "@/lib/research/evidence";
import type { EventRecord, OrganizationSnapshot, Task } from "@/types";

export function InboxPanel({
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
      <button type="button" disabled={busy === "gmail-sync"} onClick={onSync} className={btnGhost}>
        {busy === "gmail-sync" ? "Scanning…" : "Scan inbox"}
      </button>
      <button type="button" disabled={busy === "gmail-disconnect"} onClick={onDisconnect} className={btnQuiet}>
        Disconnect
      </button>
    </div>
  ) : (
    <div className="flex flex-wrap gap-2">
      {gmail.configured ? (
        <a href={`/api/organizations/${organizationId}/gmail/connect`} className={btnPrimary}>
          Connect Gmail
        </a>
      ) : null}
      <button type="button" disabled={busy === "gmail-demo"} onClick={onDemo} className={btnGhost}>
        {busy === "gmail-demo" ? "Loading…" : "Preview sample inbox"}
      </button>
    </div>
  );

  return (
    <Panel title={gmail.connected ? gmail.email ?? "Inbox" : "Inbox"} eyebrow="Mail" action={action}>
      {!gmail.connected && !gmail.configured ? (
        <Empty label="Connect Gmail to surface launch-relevant mail, or preview a sample inbox." />
      ) : null}
      {gmail.connected && relevant.length === 0 && messages.length === 0 ? (
        <Empty label="Gmail is connected. Scan the inbox to surface mail that matches this launch." />
      ) : null}
      {relevant.length === 0 && messages.length > 0 ? (
        <Empty label="Scanned. Nothing looked relevant to this launch." />
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
              {item.snippet ? <p className="mt-2 text-sm leading-6 text-[#928c97]">{item.snippet}</p> : null}
              <p className="mt-2 text-xs text-[#c2b8ff]">{item.relevanceReason}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}

export function HiringShortlistPanel({
  organizationId,
  goal,
  roles,
  events,
  hiringTask,
  busy,
  onBusy,
  onError,
  onSaved,
}: {
  organizationId: string;
  goal: string;
  roles: string[];
  events: EventRecord[];
  hiringTask?: Task;
  busy: string | null;
  onBusy: (value: string | null) => void;
  onError: (value: string | null) => void;
  onSaved: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<string[]>(roles.length ? roles : suggestHiringRoles(goal));
  const candidates = mergeHiringCandidates(hiringCandidatesFromEvents(events), hiringCandidatesFromTask(hiringTask));
  const status = hiringTask?.status;
  const searching = busy === "hiring-roles" || status === "in_progress";

  useEffect(() => {
    setSelected(roles.length ? roles : suggestHiringRoles(goal));
    setOpen(true);
  }, [roles, goal]);

  function toggle(role: string) {
    setSelected((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
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
      id="hiring"
      eyebrow="Hiring"
      title="Candidate shortlist"
      action={
        <div className="flex flex-wrap items-center gap-2">
          {status ? <HiringStatusBadge status={status} searching={searching} /> : null}
          <button type="button" onClick={() => setOpen((value) => !value)} className={btnGhost}>
            {open ? "Hide roles" : roles.length ? "Edit roles" : "Set roles"}
          </button>
        </div>
      }
    >
      {candidates.length > 0 ? (
        <ul className="space-y-4">
          {candidates.map((candidate) => (
            <li key={candidate.url} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
              <p className="text-[11px] uppercase tracking-[0.06em] text-[#928c97]">{candidate.role}</p>
              <a
                href={candidate.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex min-h-11 items-center text-sm text-[#c2b8ff] underline-offset-4 hover:underline"
              >
                {candidate.title}
              </a>
              {candidate.snippet ? <p className="mt-1 text-sm leading-6 text-[#928c97]">{candidate.snippet}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          label={
            searching
              ? "Searching public LinkedIn profiles…"
              : status === "blocked"
                ? "Hiring is waiting on the wedge. After that, Rivera searches public LinkedIn profiles."
                : "No candidates yet. Pick roles and search public LinkedIn profiles."
          }
        />
      )}
      {open ? (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          <p className="text-sm leading-6 text-[#928c97]">
            {roles.length === 0
              ? "This org never searched candidates. Confirm the roles from the brief (or change them) and save — Rivera will search LinkedIn now."
              : "Save to run or refresh the shortlist from public LinkedIn profiles."}
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
            <button type="button" onClick={() => setSelected(suggestHiringRoles(goal))} className={btnQuiet}>
              Suggest from brief
            </button>
            <button type="button" disabled={busy === "hiring-roles"} onClick={() => void save()} className={btnPrimary}>
              {busy === "hiring-roles" ? "Searching…" : "Save and search"}
            </button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function HiringStatusBadge({ status, searching }: { status: Task["status"]; searching: boolean }) {
  if (searching) return <StatusBadge value="Searching" tone="warn" />;
  if (status === "done") return <StatusBadge value="Shortlisted" tone="good" />;
  if (status === "blocked") return <StatusBadge value="Blocked" tone="warn" />;
  if (status === "failed") return <StatusBadge value="Failed" tone="bad" />;
  return <StatusBadge value={status.replaceAll("_", " ")} />;
}
