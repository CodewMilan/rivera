import Link from "next/link";
import { money, shortDate } from "@/lib/format";
import type { EventRecord, Organization } from "@/types";

export function OrganizationIntake({
  organization,
  events,
}: {
  organization: Organization;
  events: EventRecord[];
}) {
  const remaining = organization.budgetCents - organization.budgetUsedCents;
  const created = events.filter((event) => event.type === "organization.created");

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.2em] text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          Rivera
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{organization.name}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{organization.goal}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Phase" value="Intake" />
        <Metric label="Budget used" value={`${money(organization.budgetUsedCents)} / ${money(organization.budgetCents)}`} />
        <Metric label="Remaining" value={money(remaining)} />
        <Metric label="Deadline" value={shortDate(organization.deadline)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium">Organization</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Target user" value={organization.targetUser || "Not set"} />
            <Row label="Technology" value={organization.technology || "Not set"} />
            <Row label="Channels" value={organization.preferredChannels.join(", ") || "None"} />
            <Row label="Status" value={organization.status} />
          </dl>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium">What happens next</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            This organization is saved. Agents, tasks, and a live run start in Phase 2.
            Nothing has been researched, generated, or published.
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium">Recent activity</h2>
        {created.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span>{event.summary}</span>
                <time className="font-mono text-xs text-muted-foreground">{shortDate(event.createdAt)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-lg tabular-nums capitalize">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
