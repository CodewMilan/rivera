import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { OrgShell } from "@/components/org-shell";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/organizations/${id}/build`)}`);

  const store = await getStore();
  const snapshot = await store.snapshot(id);
  if (!snapshot) notFound();
  if (snapshot.organization.ownerUserId && snapshot.organization.ownerUserId !== userId) notFound();

  return <OrgShell id={id} tab="build" />;
}
