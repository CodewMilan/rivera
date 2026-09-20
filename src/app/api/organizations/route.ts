import { auth } from "@clerk/nextjs/server";
import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { errorJson, json, readJson } from "@/lib/http/json";
import { getStore } from "@/lib/store";
import { parseIntake } from "@/lib/validation/intake";

async function currentUserId(): Promise<string | undefined> {
  try {
    const { userId } = await auth();
    return userId ?? undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const parsed = parseIntake(await readJson(request));
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? "Invalid intake", 400, {
      issues: parsed.error.flatten(),
    });
  }
  const store = await getStore();
  const organization = await createOrganizationFromIntake(store, parsed.data, {
    ownerUserId: await currentUserId(),
  });
  return json({ organization }, 201);
}

export async function GET() {
  const store = await getStore();
  const organizations = await store.listOrganizations();
  const userId = await currentUserId();
  if (!userId) return json({ organizations });
  const mine = organizations.filter((org) => org.ownerUserId === userId);
  return json({ organizations: mine.length ? mine : organizations });
}
