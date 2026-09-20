"use client";

import {
  Bot,
  CircleDollarSign,
  Code2,
  Compass,
  Inbox,
  Map,
  Megaphone,
  Scale,
  Search,
  Share2,
  Swords,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge, toneForStatus } from "@/components/status-badge";
import { cn } from "@/lib/cn";
import type { DashboardTab } from "@/lib/dashboard";
import type { AgentType, Asset, OrganizationSnapshot } from "@/types";

export type DashCtx = {
  organizationId: string;
  snapshot: OrganizationSnapshot;
  busy: string | null;
  act: (path: string, id?: string) => Promise<void>;
  load: () => void | Promise<void>;
  setBusy: (value: string | null) => void;
  setError: (value: string | null) => void;
  goTo: (tab: DashboardTab, focus?: string) => void;
};

const AGENT_ICONS: Record<AgentType, LucideIcon> = {
  ceo: Compass,
  research: Search,
  strategy: Map,
  engineering: Code2,
  finance: CircleDollarSign,
  marketing: Megaphone,
  social_media: Share2,
  hiring: UserPlus,
  competitor: Swords,
  inbox: Inbox,
  evaluator: Scale,
};

export function AgentIcon({ type, className }: { type: AgentType; className?: string }) {
  const Icon = AGENT_ICONS[type] ?? Bot;
  return <Icon aria-hidden className={cn("size-4", className)} strokeWidth={1.6} />;
}

export function Surface({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-28 rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5", className)}>
      {children}
    </section>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
  id,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <Surface id={id} className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-[11px] uppercase tracking-[0.08em] text-[#c2b8ff]">{eyebrow}</p> : null}
          <h2 className="text-[15px] font-medium leading-6 text-[#f4f2f0]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Surface>
  );
}

export function Empty({
  label,
  action,
}: {
  label: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="max-w-prose text-sm leading-6 text-[#928c97]">{label}</p>
      {action}
    </div>
  );
}

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-[5px] border border-white bg-white px-4 text-sm text-[#221d2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60";
export const btnGhost =
  "inline-flex min-h-11 items-center justify-center rounded-[5px] border border-[#c2b8ff] px-4 text-sm text-[#c2b8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60";
export const btnQuiet =
  "inline-flex min-h-11 items-center justify-center rounded-[5px] px-3 text-sm text-[#928c97] hover:text-[#f4f2f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60";

export function LiveDot({ live }: { live?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full",
        live ? "live-dot bg-[#c2b8ff]" : "bg-[#928c97]/50",
      )}
      aria-hidden
    />
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.06em] text-[#928c97]">{label}</p>
        <p className="font-mono text-sm tabular-nums text-[#f4f2f0]">{clamped}</p>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#c2b8ff]" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function MediaPreview({ asset, kind }: { asset: Asset; kind: string }) {
  const src = asset.previewUrl ?? asset.url;
  const videoFile = /\.(mp4|webm|mov)(\?|$)/i.test(asset.url);
  return (
    <figure className="overflow-hidden rounded-[8px] border border-white/10 bg-[#0c0a10]">
      {kind === "video" && videoFile ? (
        <video src={asset.url} poster={asset.previewUrl} controls className="max-h-64 w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="max-h-64 w-full object-cover" />
      )}
      <figcaption className="px-3 py-2 text-xs text-[#928c97]">
        {kind === "video" ? "Video preview" : "Still"}
        {asset.provider ? ` · ${asset.provider}` : ""}
      </figcaption>
    </figure>
  );
}

export function TaskStatus({ status }: { status: string }) {
  return <StatusBadge value={status} tone={toneForStatus(status)} />;
}
