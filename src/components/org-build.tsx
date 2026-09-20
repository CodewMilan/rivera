"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusBadge, toneForStatus } from "@/components/status-badge";
import type { BuildConfig, BuildRun, GitHubRepoSummary, GitHubStatus } from "@/types";

const CURSOR_MODELS = ["composer-2", "composer-2.5"];
const CURSOR_KEYS_URL = "https://cursor.com/dashboard/api";

type BuildBoardData = {
  organizationId: string;
  github: GitHubStatus;
  buildConfig: BuildConfig;
  builds: BuildRun[];
};

async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : "Request failed";
    throw new Error(message);
  }
  return data;
}

export function OrgBuild({ data, compact = false }: { data: BuildBoardData; compact?: boolean }) {
  const [github, setGithub] = useState<GitHubStatus>(data.github);
  const [config, setConfig] = useState<BuildConfig>(data.buildConfig);
  const [builds, setBuilds] = useState<BuildRun[]>(data.builds);
  const [setupOpen, setSetupOpen] = useState(
    !(data.github.connected && data.buildConfig.cursorApiKeySet && Boolean(data.buildConfig.repoFullName)),
  );
  const [repos, setRepos] = useState<GitHubRepoSummary[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [cursorKeyInput, setCursorKeyInput] = useState("");
  const [showCursorPaste, setShowCursorPaste] = useState(false);
  const [brief, setBrief] = useState<string>("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [model, setModel] = useState(CURSOR_MODELS[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedRepo = useMemo(
    () => repos.find((r) => r.fullName === config.repoFullName),
    [repos, config.repoFullName],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const gh = params.get("github");
    if (gh) {
      setError(`GitHub: ${gh.replaceAll("_", " ")}`);
      params.delete("github");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${params.toString() ? `?${params}` : ""}`,
      );
    }
  }, []);

  useEffect(() => {
    setGithub(data.github);
    setBuilds(data.builds);
  }, [data.github, data.builds]);

  useEffect(() => {
    if (!github.connected) return;
    void loadRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [github.connected]);

  useEffect(() => {
    const active = builds.filter((b) => b.status === "queued" || b.status === "running");
    if (active.length === 0) return;
    const timer = window.setInterval(() => {
      void Promise.all(active.map((b) => refreshBuild(b.id)));
    }, 4000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builds]);

  async function loadRepos() {
    setReposLoading(true);
    setReposError(null);
    try {
      const data = (await apiFetch(`/api/organizations/${config.organizationId}/github/repos`)) as {
        repos: GitHubRepoSummary[];
      };
      setRepos(data.repos);
    } catch (cause) {
      setReposError(cause instanceof Error ? cause.message : "Could not list repositories");
    } finally {
      setReposLoading(false);
    }
  }

  async function saveConfig(patch: Record<string, unknown>, label = "config") {
    setBusy(label);
    setError(null);
    try {
      const data = (await apiFetch(`/api/organizations/${config.organizationId}/build/config`, {
        method: "POST",
        body: JSON.stringify(patch),
      })) as { config: BuildConfig };
      setConfig(data.config);
      setNotice("Saved");
      window.setTimeout(() => setNotice(null), 2000);
      return data.config;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function connectCursor() {
    if (!cursorKeyInput.trim()) {
      setError("Paste the key you copied from Cursor");
      return;
    }
    const result = await saveConfig({ cursorApiKey: cursorKeyInput }, "cursor-connect");
    if (result?.cursorApiKeySet) {
      setCursorKeyInput("");
      setShowCursorPaste(false);
    }
  }

  function openCursorKeys() {
    setShowCursorPaste(true);
    if (typeof window !== "undefined") {
      window.open(CURSOR_KEYS_URL, "_blank", "noopener,noreferrer");
    }
  }

  async function refreshBrief() {
    setBriefLoading(true);
    try {
      const data = (await apiFetch(`/api/organizations/${config.organizationId}/build/brief`)) as { brief: string };
      setBrief(data.brief);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Brief failed");
    } finally {
      setBriefLoading(false);
    }
  }

  async function startBuild() {
    setBusy("start");
    setError(null);
    try {
      const data = (await apiFetch(`/api/organizations/${config.organizationId}/build`, {
        method: "POST",
        body: JSON.stringify({ promptOverride: brief.trim() ? brief : undefined, model }),
      })) as { build: BuildRun };
      setBuilds((prev) => [data.build, ...prev]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dispatch failed");
    } finally {
      setBusy(null);
    }
  }

  async function refreshBuild(id: string) {
    try {
      const data = (await apiFetch(`/api/builds/${id}`)) as { build: BuildRun };
      setBuilds((prev) => prev.map((b) => (b.id === id ? data.build : b)));
    } catch {
      // silent
    }
  }

  async function disconnectGithub() {
    setBusy("gh-disconnect");
    try {
      const data = (await apiFetch(`/api/organizations/${config.organizationId}/github/disconnect`, {
        method: "POST",
      })) as { github: GitHubStatus };
      setGithub(data.github);
      setRepos([]);
      setConfig((prev) => ({ ...prev, repoFullName: undefined, repoUrl: undefined, branch: undefined }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Disconnect failed");
    } finally {
      setBusy(null);
    }
  }

  const canStart =
    config.cursorApiKeySet && Boolean(config.repoFullName) && Boolean(config.branch || selectedRepo?.defaultBranch);
  const ready = github.connected && config.cursorApiKeySet && Boolean(config.repoFullName);
  const showSetup = setupOpen || !ready;

  return (
    <div className="space-y-8">
      {compact ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-[15px] font-medium text-[#f4f2f0]">Build with Cursor</h3>
            <p className="mt-1 max-w-prose text-sm leading-6 text-[#928c97]">
              Compile the run into a brief and dispatch a Cursor cloud agent against your repo.
            </p>
          </div>
          {ready ? (
            <button
              type="button"
              onClick={() => setSetupOpen((value) => !value)}
              className="inline-flex min-h-11 items-center rounded-[5px] px-3 text-sm text-[#928c97] hover:text-[#f4f2f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
            >
              {showSetup ? "Hide setup" : "Change setup"}
            </button>
          ) : null}
        </div>
      ) : (
        <header>
          <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Development</p>
          <h1 className="mt-2 text-[36px] font-normal leading-[44px] tracking-[-1.2px] text-[#f4f2f0]">
            Ship the plan with Cursor
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-[24px] text-[#928c97]">
            Rivera compiles research, strategy, and engineering into one brief and hands it to a Cursor cloud agent.
            The agent runs on a Cursor VM, writes code against your GitHub repo, and opens a pull request.
          </p>
        </header>
      )}
      {compact && ready && !showSetup ? (
        <p className="text-sm text-[#928c97]">
          GitHub <span className="font-mono text-[#f4f2f0]">{github.login}</span>
          <span className="mx-2 text-white/20">·</span>
          Cursor connected
          <span className="mx-2 text-white/20">·</span>
          <span className="font-mono text-[#f4f2f0]">{config.repoFullName}</span>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className="text-xs text-[#c2b8ff]">{notice}</p> : null}

      {showSetup ? (
      <section className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="1. Connect GitHub"
          badge={github.connected ? <StatusBadge value="connected" tone="good" /> : null}
        >
          {!github.configured ? (
            <p className="text-sm text-muted-foreground">
              GitHub OAuth is not configured on this deployment.
            </p>
          ) : github.connected ? (
            <div className="space-y-3">
              <p className="text-sm">
                Connected as <span className="font-mono">{github.login}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadRepos()}
                  className="min-h-11 rounded-lg border border-[#c2b8ff] px-3 text-xs text-[#c2b8ff]"
                >
                  {reposLoading ? "Refreshing…" : "Refresh repo list"}
                </button>
                <button
                  type="button"
                  onClick={() => void disconnectGithub()}
                  disabled={busy === "gh-disconnect"}
                  className="min-h-11 rounded-lg border border-border px-3 text-xs"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <a
              href={`/api/organizations/${config.organizationId}/github/connect`}
              className="inline-flex min-h-11 items-center rounded-[5px] bg-white px-4 text-sm text-[#221d2a]"
            >
              Connect GitHub
            </a>
          )}
        </Panel>

        <Panel
          title="2. Connect Cursor"
          badge={config.cursorApiKeySet ? <StatusBadge value="connected" tone="good" /> : null}
        >
          {config.cursorApiKeySet ? (
            <div className="space-y-3">
              <p className="text-sm">
                Connected as{" "}
                <span className="font-mono">{config.cursorAccountLabel ?? "Cursor account"}</span>
              </p>
              {config.cursorConnectedAt ? (
                <p className="text-xs text-muted-foreground">
                  Connected {new Date(config.cursorConnectedAt).toLocaleString()}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openCursorKeys}
                  className="min-h-11 rounded-lg border border-[#c2b8ff] px-3 text-xs text-[#c2b8ff]"
                >
                  Rotate key
                </button>
                <button
                  type="button"
                  onClick={() => void saveConfig({ clearCursorApiKey: true }, "cursor-forget")}
                  disabled={busy === "cursor-forget"}
                  className="min-h-11 rounded-lg border border-border px-3 text-xs"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : !showCursorPaste ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                We open Cursor's API Keys page in a new tab. Create a key, come back, and paste it here — we verify it against Cursor and encrypt it at rest.
              </p>
              <button
                type="button"
                onClick={openCursorKeys}
                className="inline-flex min-h-11 items-center rounded-[5px] bg-white px-4 text-sm text-[#221d2a]"
              >
                Connect Cursor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Cursor opened in a new tab. On that page, click <span className="font-medium">New API Key</span>, copy the key, and paste it below.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  autoFocus
                  value={cursorKeyInput}
                  onChange={(event) => setCursorKeyInput(event.target.value)}
                  placeholder="crsr_..."
                  className="min-h-11 flex-1 rounded-lg border border-border bg-transparent px-3 font-mono text-sm"
                />
                <button
                  type="button"
                  disabled={!cursorKeyInput.trim() || busy === "cursor-connect"}
                  onClick={() => void connectCursor()}
                  className="min-h-11 rounded-lg bg-primary px-3 text-xs text-primary-foreground disabled:opacity-40"
                >
                  {busy === "cursor-connect" ? "Verifying…" : "Verify and connect"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCursorPaste(false);
                    setCursorKeyInput("");
                  }}
                  className="min-h-11 rounded-lg border border-border px-3 text-xs"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Rivera never displays the key back. We hit Cursor's <code>/v1/me</code> to verify it and store an AES-256-GCM ciphertext.
              </p>
            </div>
          )}
        </Panel>

        <Panel title="3. Pick a repo">
          {!github.connected ? (
            <p className="text-sm text-muted-foreground">Connect GitHub first.</p>
          ) : reposError ? (
            <p className="text-sm text-destructive">{reposError}</p>
          ) : (
            <div className="space-y-3">
              <select
                value={config.repoFullName ?? ""}
                onChange={(event) => {
                  const repo = repos.find((r) => r.fullName === event.target.value);
                  void saveConfig({
                    repoFullName: repo?.fullName ?? "",
                    branch: repo?.defaultBranch,
                  });
                }}
                className="min-h-11 w-full rounded-lg border border-border bg-transparent px-3 text-sm"
              >
                <option value="">Select a repository…</option>
                {repos.map((repo) => (
                  <option key={repo.fullName} value={repo.fullName}>
                    {repo.fullName}
                    {repo.private ? " (private)" : ""}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-muted-foreground">Starting branch</label>
                <input
                  type="text"
                  value={config.branch ?? ""}
                  onChange={(event) => setConfig((prev) => ({ ...prev, branch: event.target.value }))}
                  onBlur={(event) => void saveConfig({ branch: event.target.value })}
                  placeholder={selectedRepo?.defaultBranch ?? "main"}
                  className="min-h-11 flex-1 rounded-lg border border-border bg-transparent px-3 font-mono text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={config.autoCreatePR}
                  onChange={(event) => void saveConfig({ autoCreatePR: event.target.checked })}
                />
                Open a pull request automatically when done
              </label>
            </div>
          )}
        </Panel>

        <Panel title="4. Model">
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-transparent px-3 text-sm"
          >
            {CURSOR_MODELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-muted-foreground">
            Runs started here also appear in the Cursor Agents window, so you can watch or take over.
          </p>
        </Panel>
      </section>
      ) : null}

      <section className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{showSetup ? "5. Review the brief" : "Review the brief"}</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refreshBrief()}
              className="min-h-11 rounded-lg border border-[#c2b8ff] px-3 text-xs text-[#c2b8ff]"
            >
              {briefLoading ? "Compiling…" : brief ? "Recompile from run" : "Compile brief"}
            </button>
            <button
              type="button"
              disabled={!canStart || busy === "start"}
              onClick={() => void startBuild()}
              className="min-h-11 rounded-lg bg-white px-4 text-sm text-[#221d2a] disabled:opacity-40"
            >
              {busy === "start" ? "Dispatching…" : "Build with Cursor"}
            </button>
          </div>
        </div>
        <textarea
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          placeholder="Compile the brief to see what Rivera will send. You can edit it before dispatch."
          className="mt-4 h-64 w-full rounded-lg border border-border bg-transparent p-3 font-mono text-xs"
        />
        {!canStart ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Connect Cursor and pick a repo to enable dispatch.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Build history</h2>
        {builds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing dispatched yet.</p>
        ) : null}
        <ul className="space-y-3">
          {builds.map((build) => (
            <li key={build.id} className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{build.repoFullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {build.provider} · {build.model} · branch {build.branch}
                  </p>
                </div>
                <StatusBadge value={build.status} tone={toneForStatus(build.status)} />
              </div>
              {build.summary ? <p className="mt-2 text-xs text-muted-foreground">{build.summary}</p> : null}
              {build.error ? <p className="mt-2 text-xs text-destructive">{build.error}</p> : null}
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {build.prUrl ? (
                  <a href={build.prUrl} target="_blank" rel="noreferrer" className="text-[#c2b8ff] underline">
                    Pull request
                  </a>
                ) : null}
                {build.agentUrl ? (
                  <a href={build.agentUrl} target="_blank" rel="noreferrer" className="text-[#c2b8ff] underline">
                    Open in Cursor
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => void refreshBuild(build.id)}
                  className="text-muted-foreground underline"
                >
                  Refresh
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Panel({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <section className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        {badge}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
