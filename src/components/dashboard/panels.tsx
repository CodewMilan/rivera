"use client";

import { useEffect, useState } from "react";
import { Empty, Panel, btnGhost, btnPrimary, btnQuiet } from "@/components/dashboard/shared";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/cn";
import { HIRING_ROLE_PRESETS, suggestHiringRoles } from "@/lib/intake/roles";
import type { OrganizationSnapshot } from "@/types";

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
      eyebrow="Optional"
      title="Hiring shortlist"
      action={
        <button type="button" onClick={() => setOpen((value) => !value)} className={btnGhost}>
          {open ? "Hide" : roles.length ? "Edit" : "Set roles"}
        </button>
      }
    >
      {roles.length === 0 && !open ? (
        <Empty label="Leave this off unless you want Rivera to source candidates." />
      ) : null}
      {open ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#928c97]">
            Rivera will not recruit until you pick roles. Suggestions come from the brief if you want a starting point.
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
              {busy === "hiring-roles" ? "Saving…" : "Save roles"}
            </button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
