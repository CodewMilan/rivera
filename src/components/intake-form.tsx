"use client";

import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

const EXAMPLES = [
  "Build a developer tool that helps Stellar developers debug Soroban transactions in 30 days with a $500 budget.",
  "Launch a local-first CLI for decoding failed smart-contract simulations.",
];

const ROLE_PRESETS = [
  "Founding Engineer",
  "AI Engineer",
  "Systems Architect",
  "Full-stack Engineer",
  "Product Designer",
  "Developer Advocate",
];

function defaultDeadline() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function IntakeForm() {
  const router = useRouter();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [goal, setGoal] = useState("");
  const [roles, setRoles] = useState<string[]>(["Founding Engineer", "AI Engineer"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resize() {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(Math.max(area.scrollHeight, 88), 220)}px`;
  }

  function toggleRole(role: string) {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const create = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal,
        deadline: defaultDeadline(),
        budgetUsd: 500,
        preferredChannels: ["x", "linkedin", "instagram", "tiktok"],
        hiringRoles: roles,
        autoPublish: false,
      }),
    });
    const created = await create.json();
    if (!create.ok) {
      setPending(false);
      setError(created.error ?? "Could not start the organization");
      areaRef.current?.focus();
      return;
    }

    router.push(`/organizations/${created.organization.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-[720px]">
      <label htmlFor="goal" className="sr-only">
        Goal
      </label>
      <div
        className={cn(
          "rounded-[16px] border border-white/12 bg-[#1f1c26] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
          "focus-within:border-[#c2b8ff]/50 focus-within:ring-2 focus-within:ring-[#c2b8ff]/40",
        )}
      >
        <textarea
          id="goal"
          ref={areaRef}
          name="goal"
          required
          minLength={10}
          rows={3}
          value={goal}
          placeholder="Describe the product you want to launch…"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "goal-error" : "goal-hint"}
          onChange={(event) => {
            setGoal(event.target.value);
            resize();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          className="min-h-[88px] w-full resize-none bg-transparent px-2 pt-2 text-[16px] leading-[26px] text-[#f4f2f0] outline-none placeholder:text-[#928c97]"
        />
        <div className="mt-2 flex items-end justify-between gap-3 px-1 pb-1">
          <p id="goal-hint" className="text-xs text-[#928c97]">
            Enter to start · Shift + Enter for a new line
          </p>
          <button
            type="submit"
            disabled={pending || goal.trim().length < 10}
            aria-label={pending ? "Starting Rivera" : "Start Rivera"}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#221d2a] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-40"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error ? (
        <p id="goal-error" className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <fieldset className="mt-6 rounded-[12px] border border-white/10 bg-[#1a1720] p-4">
        <legend className="px-1 text-xs uppercase tracking-wide text-[#928c97]">
          Roles to shortlist
        </legend>
        <p className="text-xs text-[#928c97]">
          Rivera scans public LinkedIn profiles for each role selected.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ROLE_PRESETS.map((role) => {
            const selected = roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleRole(role)}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]",
                  selected
                    ? "border-[#c2b8ff] bg-[rgba(194,184,255,0.15)] text-[#f4f2f0]"
                    : "border-white/15 text-[#c2b8ff] hover:border-[#c2b8ff]",
                )}
              >
                {role}
              </button>
            );
          })}
        </div>
      </fieldset>

      <ul className="mt-5 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((example) => (
          <li key={example}>
            <button
              type="button"
              onClick={() => {
                setGoal(example);
                requestAnimationFrame(() => {
                  resize();
                  areaRef.current?.focus();
                });
              }}
              className="min-h-11 max-w-[340px] truncate rounded-full border border-white/15 px-4 text-left text-sm text-[#c2b8ff] transition-colors hover:border-[#c2b8ff] hover:bg-[rgba(194,184,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
            >
              {example}
            </button>
          </li>
        ))}
      </ul>
    </form>
  );
}
