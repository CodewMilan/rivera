import { notFound } from "next/navigation";
import { OrgDashboard, type DashboardTab } from "@/components/org-dashboard";
import { AppMain } from "@/components/site/site-chrome";
import { getStore } from "@/lib/store";

export async function OrgShell({ id, tab }: { id: string; tab: DashboardTab }) {
  const store = await getStore();
  const snapshot = await store.snapshot(id);
  if (!snapshot) notFound();
  return (
    <AppMain>
      <OrgDashboard organizationId={id} initialTab={tab} initialSnapshot={snapshot} />
    </AppMain>
  );
}
