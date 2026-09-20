import { requireOrgAccess } from "@/lib/auth/org-guard";
import { nowIso } from "@/lib/clock";
import { encryptSecret } from "@/lib/crypto/secret";
import { errorJson, json, readJson } from "@/lib/http/json";
import { getCursorAccount } from "@/lib/providers/cursor";

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
  const access = await requireOrgAccess(id);
  if (access instanceof Response) return access;
  const { store } = access;

  const body = ((await readJson(request)) ?? {}) as ConfigPatch;
  const current = await store.getBuildConfig(id);

  let cursorApiKeySet = current.cursorApiKeySet;
  let cursorAccountLabel = current.cursorAccountLabel;
  let cursorConnectedAt = current.cursorConnectedAt;

  if (body.clearCursorApiKey) {
    await store.setBuildSecret({ organizationId: id, cursorApiKey: undefined });
    cursorApiKeySet = false;
    cursorAccountLabel = undefined;
    cursorConnectedAt = undefined;
  } else if (typeof body.cursorApiKey === "string" && body.cursorApiKey.trim()) {
    const raw = body.cursorApiKey.trim();
    // Verify the key against Cursor before we bother encrypting anything.
    try {
      const account = await getCursorAccount(raw);
      cursorAccountLabel = account.label;
      cursorConnectedAt = nowIso();
    } catch (error) {
      return errorJson(
        error instanceof Error ? `Cursor rejected that key: ${error.message}` : "Cursor rejected that key",
        400,
      );
    }
    await store.setBuildSecret({ organizationId: id, cursorApiKey: encryptSecret(raw) });
    cursorApiKeySet = true;
  }

  let repoUrl = current.repoUrl;
  const repoFullName =
    typeof body.repoFullName === "string" ? body.repoFullName.trim() || undefined : current.repoFullName;
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
    cursorAccountLabel,
    cursorConnectedAt,
    repoFullName,
    repoUrl,
    branch,
    autoCreatePR: typeof body.autoCreatePR === "boolean" ? body.autoCreatePR : current.autoCreatePR,
    updatedAt: nowIso(),
  });
  return json({ config: next });
}
