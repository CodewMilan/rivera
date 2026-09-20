import { nowIso } from "@/lib/clock";
import { errorJson, json, readJson } from "@/lib/http/json";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

type ConfigPatch = {
  cursorApiKey?: string;
  clearCursorApiKey?: boolean;
  repoFullName?: string;
  branch?: string;
  autoCreatePR?: boolean;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = await getStore();
  const org = await store.getOrganization(id);
  if (!org) return errorJson("Organization not found", 404);
  const body = ((await readJson(request)) ?? {}) as ConfigPatch;
  const current = await store.getBuildConfig(id);
  const existingSecret = await store.getBuildSecret(id);

  let cursorApiKeySet = current.cursorApiKeySet;
  if (body.clearCursorApiKey) {
    await store.setBuildSecret({ organizationId: id, cursorApiKey: undefined });
    cursorApiKeySet = false;
  } else if (typeof body.cursorApiKey === "string" && body.cursorApiKey.trim()) {
    await store.setBuildSecret({ organizationId: id, cursorApiKey: body.cursorApiKey.trim() });
    cursorApiKeySet = true;
  } else if (existingSecret?.cursorApiKey) {
    cursorApiKeySet = true;
  }

  let repoUrl = current.repoUrl;
  const repoFullName = typeof body.repoFullName === "string" ? body.repoFullName.trim() || undefined : current.repoFullName;
  if (repoFullName) {
    if (!/^[^/\s]+\/[^/\s]+$/.test(repoFullName)) {
      return errorJson("repoFullName must look like owner/name", 400);
    }
    repoUrl = `https://github.com/${repoFullName}`;
  } else if (body.repoFullName === "") {
    repoUrl = undefined;
  }

  const branch = typeof body.branch === "string" ? body.branch.trim() || undefined : current.branch;

  const next = await store.upsertBuildConfig({
    organizationId: id,
    cursorApiKeySet,
    repoFullName,
    repoUrl,
    branch,
    autoCreatePR: typeof body.autoCreatePR === "boolean" ? body.autoCreatePR : current.autoCreatePR,
    updatedAt: nowIso(),
  });
  return json({ config: next });
}
