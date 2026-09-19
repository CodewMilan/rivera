import { notFound } from "next/navigation";
import { OrganizationIntake } from "@/components/organization-intake";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const organization = await store.getOrganization(id);
  if (!organization) notFound();
  const events = await store.listEvents(id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <OrganizationIntake organization={organization} events={events} />
    </main>
  );
}
