import type { RunStatus } from "@/types";

export function money(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function phaseLabel(status?: RunStatus): string {
  if (!status) return "Intake";
  return status.replaceAll("_", " ");
}

export function shortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
