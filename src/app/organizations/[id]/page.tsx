import { OrgShell } from "@/components/org-shell";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrgShell id={id} tab="overview" />;
}
