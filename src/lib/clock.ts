export function nowIso(): string {
  return new Date().toISOString();
}

export function isExpired(iso?: string, now = Date.now()): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() <= now;
}
