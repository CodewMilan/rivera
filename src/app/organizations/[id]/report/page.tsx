import { OrgDashboard } from "@/components/org-dashboard";
import { AppMain } from "@/components/site/site-chrome";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppMain>
      <OrgDashboard organizationId={id} initialTab="report" />
    </AppMain>
  );
}
