import { auth } from "@clerk/nextjs/server";
import { errorJson } from "@/lib/http/json";
import { getStore, type Store } from "@/lib/store";
import type { Organization } from "@/types";

export type OrgAccess = {
  store: Store;
  organization: Organization;
  userId: string;
};

/**
 * Resolve the signed-in user, load the org, and enforce that the user owns it.
 * Every write route in the Development surface should call this first.
 *
 * Legacy demo orgs created before Clerk was wired up may not have an
 * `ownerUserId`. We accept those only when the caller is signed in — never
 * anonymously — so an unauthenticated visitor can't touch a demo org's secrets.
 */
export async function requireOrgAccess(organizationId: string): Promise<OrgAccess | Response> {
  let userId: string | null = null;
  try {
    userId = (await auth()).userId ?? null;
  } catch {
    userId = null;
  }
  if (!userId) return errorJson("Sign in first", 401);

  const store = await getStore();
  const organization = await store.getOrganization(organizationId);
  if (!organization) return errorJson("Organization not found", 404);

  if (organization.ownerUserId && organization.ownerUserId !== userId) {
    return errorJson("Forbidden", 403);
  }

  return { store, organization, userId };
}
