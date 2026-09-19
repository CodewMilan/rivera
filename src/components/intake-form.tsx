"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChannelLogo, type ChannelId } from "@/components/site/channel-logos";
import { cn } from "@/lib/cn";

const CHANNELS: Array<{ id: ChannelId; label: string }> = [
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram Reels" },
  { id: "tiktok", label: "TikTok" },
];

const DEMO_GOAL =
  "Build a developer tool that helps Stellar developers debug Soroban transactions in 30 days with a $500 budget.";

export function IntakeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<Record<ChannelId, boolean>>({
    x: true,
    linkedin: true,
    instagram: true,
    tiktok: true,
  });

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setFieldErrors({});

    const preferredChannels = CHANNELS.map((channel) => channel.id).filter((id) => formData.get(`channel-${id}`) === "on");
    const payload = {
      goal: String(formData.get("goal") ?? ""),
      targetUser: String(formData.get("targetUser") ?? ""),
      deadline: String(formData.get("deadline") ?? ""),
      budgetUsd: Number(formData.get("budgetUsd")),
      technology: String(formData.get("technology") ?? ""),
      preferredChannels,
      autoPublish: formData.get("autoPublish") === "on",
    };

    const create = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await create.json();
    if (!create.ok) {
      setPending(false);
      setError(created.error ?? "Could not create the organization");
      if (created.issues?.fieldErrors) {
        const next: Record<string, string> = {};
        for (const [key, messages] of Object.entries(created.issues.fieldErrors as Record<string, string[]>)) {
          if (messages[0]) next[key] = messages[0];
        }
        setFieldErrors(next);
      }
      return;
    }

    router.push(`/organizations/${created.organization.id}`);
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="goal" className="text-sm font-medium">
          Goal <span className="text-muted-foreground">(required)</span>
        </label>
        <textarea
          id="goal"
          name="goal"
          required
          rows={4}
          defaultValue={DEMO_GOAL}
          aria-invalid={Boolean(fieldErrors.goal)}
          aria-describedby={fieldErrors.goal ? "goal-error" : "goal-hint"}
          className="w-full rounded-[5px] border border-white/20 bg-[#1f1c26] px-3 py-2 text-sm text-[#f4f2f0] outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
        />
        <p id="goal-hint" className="text-xs text-muted-foreground">
          One sentence Rivera can turn into an organization.
        </p>
        {fieldErrors.goal ? (
          <p id="goal-error" className="text-xs text-destructive">
            {fieldErrors.goal}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="targetUser" className="text-sm font-medium">
            Target user
          </label>
          <input
            id="targetUser"
            name="targetUser"
            defaultValue="Soroban developers"
            autoComplete="off"
            className="min-h-11 w-full rounded-[5px] border border-white/20 bg-[#1f1c26] px-3 text-sm text-[#f4f2f0] outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="deadline" className="text-sm font-medium">
            Deadline <span className="text-muted-foreground">(required)</span>
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            required
            defaultValue="2026-10-19"
            aria-invalid={Boolean(fieldErrors.deadline)}
            className="min-h-11 w-full rounded-[5px] border border-white/20 bg-[#1f1c26] px-3 text-sm text-[#f4f2f0] outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
          />
          {fieldErrors.deadline ? <p className="text-xs text-destructive">{fieldErrors.deadline}</p> : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="budgetUsd" className="text-sm font-medium">
            Budget (USD) <span className="text-muted-foreground">(required)</span>
          </label>
          <input
            id="budgetUsd"
            name="budgetUsd"
            inputMode="decimal"
            defaultValue="500"
            aria-invalid={Boolean(fieldErrors.budgetUsd)}
            className="min-h-11 w-full rounded-[5px] border border-white/20 bg-[#1f1c26] px-3 font-mono text-sm tabular-nums text-[#f4f2f0] outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
          />
          {fieldErrors.budgetUsd ? <p className="text-xs text-destructive">{fieldErrors.budgetUsd}</p> : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="technology" className="text-sm font-medium">
            Technology constraints
          </label>
          <input
            id="technology"
            name="technology"
            defaultValue="TypeScript, Next.js, Stellar SDK"
            autoComplete="off"
            className="min-h-11 w-full rounded-[5px] border border-white/20 bg-[#1f1c26] px-3 text-sm text-[#f4f2f0] outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Preferred channels</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHANNELS.map((channel) => {
            const selected = channels[channel.id];
            return (
              <label
                key={channel.id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-[5px] border px-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#c2b8ff]",
                  selected
                    ? "border-[#c2b8ff] bg-[rgba(194,184,255,0.08)] text-[#f4f2f0]"
                    : "border-white/15 text-[#928c97]",
                )}
              >
                <input
                  type="checkbox"
                  name={`channel-${channel.id}`}
                  checked={selected}
                  onChange={(event) =>
                    setChannels((current) => ({ ...current, [channel.id]: event.target.checked }))
                  }
                  className="sr-only"
                />
                <span
                  className={cn(
                    "grid place-items-center transition-[filter,opacity]",
                    selected ? "opacity-100 grayscale-0" : "opacity-55 grayscale",
                  )}
                >
                  <ChannelLogo id={channel.id} />
                </span>
                {channel.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" name="autoPublish" className="size-4 accent-primary" />
        Allow auto-publishing after review (off unless you opt in)
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-[5px] border border-white bg-white px-[21px] py-[6px] text-[15.6px] leading-[36.96px] text-[#221d2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-60"
      >
        {pending ? "Saving organization…" : "Create organization"}
      </button>
    </form>
  );
}
