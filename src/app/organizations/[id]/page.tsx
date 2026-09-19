import { notFound } from "next/navigation";
import { OrgDashboard } from "@/components/org-dashboard";
import { AppMain } from "@/components/site/site-chrome";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const organization = await store.getOrganization(id);
  if (!organization) notFound();

  return (
    <AppMain>
      <OrgDashboard organizationId={id} initialTab="overview" />
    </AppMain>
  );
}
