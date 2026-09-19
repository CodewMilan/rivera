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
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "good" && "bg-primary/15 text-primary",
        tone === "warn" && "bg-accent/15 text-accent",
        tone === "bad" && "bg-destructive/15 text-destructive",
        tone === "live" && "bg-primary text-primary-foreground",
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
