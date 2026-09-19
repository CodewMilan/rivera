import { cn } from "@/lib/cn";

export function StatusBadge({
  value,
  tone = "muted",
}: {
  value: string;
  tone?: "muted" | "good" | "warn" | "bad" | "live";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-medium capitalize tracking-wide",
        tone === "muted" && "bg-[#1f1c26] text-[#928c97]",
        tone === "good" && "bg-[#c2b8ff]/15 text-[#c2b8ff]",
        tone === "warn" && "bg-white/10 text-[#f4f2f0]",
        tone === "bad" && "bg-destructive/15 text-destructive",
        tone === "live" && "bg-[#c2b8ff] text-[#221d2a]",
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function toneForStatus(status: string): "muted" | "good" | "warn" | "bad" | "live" {
  if (["done", "approved", "published", "complete", "success"].includes(status)) return "good";
  if (["failed", "rejected", "expired", "cancelled"].includes(status)) return "bad";
  if (["blocked", "approval_required", "review", "pending"].includes(status)) return "warn";
  if (["in_progress", "working", "processing", "planning", "research"].includes(status)) return "live";
  return "muted";
}
