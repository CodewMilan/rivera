import { OrgDashboard } from "@/components/org-dashboard";
import { AppMain } from "@/components/site/site-chrome";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppMain>
      <OrgDashboard organizationId={id} initialTab="overview" />
    </AppMain>
  );
}
