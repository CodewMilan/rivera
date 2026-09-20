import { nowIso } from "@/lib/clock";
import { appendEvent } from "@/lib/events/log";
import { createId } from "@/lib/ids";
import type { Store } from "@/lib/store";
import { DEFAULT_HIRING_ROLES } from "@/lib/demo/fixtures";
import { dollarsToCents, type IntakeInput } from "@/lib/validation/intake";
import type { Organization } from "@/types";

export async function createOrganizationFromIntake(
  store: Store,
  input: IntakeInput,
  options?: { ownerUserId?: string },
): Promise<Organization> {
  const organization = await store.createOrganization({
    id: createId(),
    name: input.name?.trim() || "Untitled Rivera org",
    goal: input.goal,
    domain: input.domain?.trim() || "developer-tools",
    targetUser: input.targetUser?.trim() || "",
    technology: input.technology?.trim() || "",
    preferredChannels: input.preferredChannels ?? ["x", "linkedin", "instagram", "tiktok"],
    hiringRoles: (input.hiringRoles ?? DEFAULT_HIRING_ROLES).map((role) => role.trim()).filter(Boolean),
    autoPublish: input.autoPublish ?? false,
    budgetCents: dollarsToCents(input.budgetUsd),
    budgetUsedCents: 0,
    deadline: new Date(input.deadline).toISOString(),
    status: "active",
    createdAt: nowIso(),
    ownerUserId: options?.ownerUserId,
  });

  await appendEvent(store, {
    organizationId: organization.id,
    type: "organization.created",
    summary: `Created organization for: ${organization.goal}`,
  });

  return organization;
}
