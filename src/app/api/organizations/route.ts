import { createOrganizationFromIntake } from "@/lib/organizations/create";
import { errorJson, json, readJson } from "@/lib/http/json";
import { getStore } from "@/lib/store";
import { parseIntake } from "@/lib/validation/intake";

export async function POST(request: Request) {
  const parsed = parseIntake(await readJson(request));
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? "Invalid intake", 400, {
      issues: parsed.error.flatten(),
    });
  }
  const store = await getStore();
  const organization = await createOrganizationFromIntake(store, parsed.data);
  return json({ organization }, 201);
}

export async function GET() {
  const store = await getStore();
  return json({ organizations: await store.listOrganizations() });
}
