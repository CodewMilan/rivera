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
      <header className="border-b border-white/10 pb-6">
        <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Intake</p>
        <h1 className="mt-2 text-[49px] font-normal leading-[60px] tracking-[-1.62px] text-[#c2b8ff]">
          <span className="text-[#f4f2f0]">{organization.name}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[19px] leading-[29.4px] text-[#928c97]">{organization.goal}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Phase" value="Intake" />
        <Metric label="Budget used" value={`${money(organization.budgetUsedCents)} / ${money(organization.budgetCents)}`} />
        <Metric label="Remaining" value={money(remaining)} />
        <Metric label="Deadline" value={shortDate(organization.deadline)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
          <h2 className="text-sm font-medium">Organization</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Target user" value={organization.targetUser || "Not set"} />
            <Row label="Technology" value={organization.technology || "Not set"} />
            <Row label="Channels" value={organization.preferredChannels.join(", ") || "None"} />
            <Row label="Status" value={organization.status} />
          </dl>
        </article>
        <article className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
          <h2 className="text-sm font-medium">What happens next</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            This organization is saved. Agents, tasks, and a live run start in Phase 2.
            Nothing has been researched, generated, or published.
          </p>
        </article>
      </section>

      <section className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
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
    <div className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-4">
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
