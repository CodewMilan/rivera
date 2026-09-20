import { notFound } from "next/navigation";
import { OrgBuild } from "@/components/org-build";
import { AppMain } from "@/components/site/site-chrome";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const snapshot = await store.snapshot(id);
  if (!snapshot) notFound();
  return (
    <AppMain>
      <OrgBuild
        data={{
          organizationId: id,
          github: snapshot.github,
          buildConfig: snapshot.buildConfig,
          builds: snapshot.builds,
        }}
      />
    </AppMain>
  );
}
