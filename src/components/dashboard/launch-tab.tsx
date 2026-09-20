"use client";

import { OrgBuild } from "@/components/org-build";
import {
  Empty,
  MediaPreview,
  ScoreBar,
  Surface,
  btnGhost,
  btnPrimary,
  btnQuiet,
  type DashCtx,
} from "@/components/dashboard/shared";
import { StatusBadge, toneForStatus } from "@/components/status-badge";
import type { Asset } from "@/types";

const JUMP = [
  { id: "report", label: "Report" },
  { id: "content", label: "Content" },
  { id: "decisions", label: "Decisions" },
  { id: "build", label: "Code" },
] as const;

export function LaunchTab({ ctx }: { ctx: DashCtx }) {
  const { snapshot, busy, act } = ctx;
  const { decisions, contentItems, mediaJobs, assets, report, github, buildConfig, builds, organization } = snapshot;
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const rendering = mediaJobs.some((job) => job.status === "queued" || job.status === "processing");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#c2b8ff]">Launch</p>
          <h2 className="mt-1 text-[22px] font-normal tracking-[-0.4px] text-[#f4f2f0]">What the org produced</h2>
          <p className="mt-1 max-w-prose text-sm leading-6 text-[#928c97]">
            Scores, posts, the CEO call, then the Cursor build. Jump to a section — no extra tabs.
          </p>
        </div>
        <nav aria-label="Launch sections" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {JUMP.map((item, index) => (
            <span key={item.id} className="flex items-center gap-4">
              {index > 0 ? <span className="text-white/20" aria-hidden>
                ·
              </span> : null}
              <a href={`#${item.id}`} className="min-h-11 inline-flex items-center text-[#c2b8ff] underline-offset-4 hover:underline">
                {item.label}
              </a>
            </span>
          ))}
        </nav>
      </div>

      <section id="report" className="scroll-mt-28">
        {report ? (
          <Surface>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#c2b8ff]">Final recommendation</p>
            <h3 className="mt-2 text-[28px] font-normal leading-9 tracking-[-0.8px] text-[#f4f2f0]">
              Opportunity {report.opportunityScore}
            </h3>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ScoreBar label="Opportunity" value={report.opportunityScore} />
              <ScoreBar label="Problem" value={report.problemStrength} />
              <ScoreBar label="Evidence" value={report.evidenceQuality} />
              <ScoreBar label="Feasibility" value={report.technicalFeasibility} />
              <ScoreBar label="Budget fit" value={report.budgetFit} />
              <ScoreBar label="Distribution" value={report.distributionPotential} />
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-[#f4f2f0]">Main risks</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#928c97]">
                  {report.mainRisks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#f4f2f0]">Next steps</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#928c97]">
                  {report.recommendedNextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Surface>
        ) : (
          <Surface>
            <Empty label="The evaluator writes the report after the run closes. Scores, risks, and next steps land here." />
          </Surface>
        )}
      </section>

      <section id="content" className="scroll-mt-28 space-y-4">
        <div>
          <h3 className="text-[15px] font-medium text-[#f4f2f0]">Content</h3>
          <p className="mt-1 text-sm leading-6 text-[#928c97]">Review captions and media before anything goes live.</p>
        </div>
        {rendering ? <p className="text-sm text-[#c2b8ff]">Higgsfield is still rendering a preview.</p> : null}
        {contentItems.length === 0 ? (
          <Surface>
            <Empty label="Launch posts appear after the social plan." />
          </Surface>
        ) : (
          <div className="grid gap-4">
            {contentItems.map((item) => {
              const media = item.mediaAssetIds
                .map((id) => assetsById.get(id))
                .filter((asset): asset is Asset => Boolean(asset));
              const job = mediaJobs.find((entry) => entry.contentItemId === item.id);
              return (
                <article key={item.id} className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
                    {media[0] ? (
                      <MediaPreview asset={media[0]} kind={item.type} />
                    ) : (
                      <div className="flex min-h-32 items-center rounded-[8px] border border-white/10 px-4 text-sm text-[#928c97]">
                        {job ? `Media ${job.status}${job.error ? `: ${job.error}` : ""}` : "No media yet"}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.06em] text-[#928c97]">{item.platform}</p>
                          <h4 className="mt-1 text-[17px] font-medium text-[#f4f2f0]">{item.title}</h4>
                        </div>
                        <StatusBadge value={item.status} tone={toneForStatus(item.status)} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#f4f2f0]">{item.hook}</p>
                      <p className="mt-2 text-sm leading-6 text-[#928c97]">{item.caption}</p>
                      {item.hashtags.length > 0 ? (
                        <p className="mt-2 text-xs text-[#c2b8ff]">{item.hashtags.join(" ")}</p>
                      ) : null}
                      {item.claimsUsed.length > 0 ? (
                        <p className="mt-2 text-xs text-[#928c97]">Claims: {item.claimsUsed.join(" · ")}</p>
                      ) : null}
                      {item.demoPublished ? (
                        <p className="mt-3 text-xs text-[#c2b8ff]">Demo mode: publishing simulated</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy === item.id || item.status === "approved" || item.status === "published" || item.status === "scheduled"}
                          className={btnPrimary}
                          onClick={() => void act(`/api/content/items/${item.id}/approve`, item.id)}
                        >
                          {busy === item.id ? "Approving…" : item.status === "approved" ? "Approved" : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busy) || item.status === "published"}
                          className={btnGhost}
                          onClick={() => void act(`/api/content/items/${item.id}/reject`, `${item.id}-r`)}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busy) || item.status === "published"}
                          className={btnQuiet}
                          onClick={() => void act(`/api/content/items/${item.id}/regenerate`, `${item.id}-g`)}
                        >
                          {busy === `${item.id}-g` ? "Regenerating…" : "Regenerate"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            busy === `${item.id}-p` ||
                            item.status === "published" ||
                            (item.status !== "approved" && item.status !== "scheduled")
                          }
                          className={btnGhost}
                          onClick={() => void act(`/api/content/items/${item.id}/publish`, `${item.id}-p`)}
                        >
                          {busy === `${item.id}-p` ? "Publishing…" : item.status === "published" ? "Published" : "Publish"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section id="decisions" className="scroll-mt-28 space-y-4">
        <div>
          <h3 className="text-[15px] font-medium text-[#f4f2f0]">Decisions</h3>
          <p className="mt-1 text-sm leading-6 text-[#928c97]">Agent proposals and the CEO call.</p>
        </div>
        {decisions.length === 0 ? (
          <Surface>
            <Empty label="Debate happens after feasibility. Questions and the CEO rationale appear here." />
          </Surface>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision) => (
              <article key={decision.id} className="rounded-[10px] bg-[rgba(39,38,45,0.8)] p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-[22px] font-normal leading-7 tracking-[-0.4px] text-[#f4f2f0]">
                    {decision.question}
                  </h4>
                  <StatusBadge value={decision.status} tone={toneForStatus(decision.status)} />
                </div>
                <ul className="mt-5 grid gap-3 md:grid-cols-2">
                  {decision.proposals.map((proposal) => (
                    <li key={proposal.id} className="rounded-[8px] border border-white/10 p-4">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#928c97]">{proposal.agentType.replaceAll("_", " ")}</p>
                      <p className="mt-2 text-sm leading-6 text-[#f4f2f0]">{proposal.recommendation}</p>
                    </li>
                  ))}
                </ul>
                {decision.rationale ? (
                  <p className="mt-5 text-sm leading-6 text-[#f4f2f0]">
                    <span className="text-[#928c97]">CEO: </span>
                    {decision.rationale}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="build" className="scroll-mt-28">
        <OrgBuild
          compact
          data={{
            organizationId: organization.id,
            github,
            buildConfig,
            builds,
          }}
        />
      </section>
    </div>
  );
}
