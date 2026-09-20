"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { clearIntakeDraft, readIntakeDraft, saveIntakeDraft } from "@/lib/intake/draft";
import { HIRING_ROLE_PRESETS, suggestHiringRoles } from "@/lib/intake/roles";

const EXAMPLES = [
  "Build a developer tool that helps Stellar developers debug Soroban transactions in 30 days with a $500 budget.",
  "Launch a local-first CLI for decoding failed smart-contract simulations.",
];

const AFTER_SIGN_IN = "/#intake";

function defaultDeadline() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function IntakeForm() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const rolesRef = useRef<HTMLFieldSetElement>(null);
  const signInRef = useRef<HTMLButtonElement>(null);
  const [goal, setGoal] = useState("");
  const [brief, setBrief] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [showRoles, setShowRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resize() {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(Math.max(area.scrollHeight, 88), 220)}px`;
  }

  useEffect(() => {
    const draft = readIntakeDraft();
    if (!draft) return;
    setGoal(draft.goal);
    setBrief(draft.goal);
    setRoles(suggestHiringRoles(draft.goal));
    requestAnimationFrame(resize);
  }, []);

  useEffect(() => {
    if (!isSignedIn || !brief) {
      setShowRoles(false);
      return;
    }
    const delay = prefersReducedMotion() ? 0 : 700;
    const timer = window.setTimeout(() => setShowRoles(true), delay);
    return () => window.clearTimeout(timer);
  }, [isSignedIn, brief]);

  useEffect(() => {
    if (!showRoles) return;
    rolesRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  }, [showRoles]);

  function toggleRole(role: string) {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  function captureBrief(next: string) {
    saveIntakeDraft(next);
    setBrief(next);
    setRoles(suggestHiringRoles(next));
  }

  function requestSignIn() {
    signInRef.current?.click();
  }

  async function startOrganization(nextGoal: string) {
    setPending(true);
    const create = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: nextGoal,
        deadline: defaultDeadline(),
        budgetUsd: 500,
        preferredChannels: ["x", "linkedin", "instagram", "tiktok"],
        hiringRoles: roles.length ? roles : suggestHiringRoles(nextGoal),
        autoPublish: false,
      }),
    });
    const created = await create.json();
    if (create.status === 401) {
      setPending(false);
      requestSignIn();
      return;
    }
    if (!create.ok) {
      setPending(false);
      setError(created.error ?? "Could not start the organization");
      areaRef.current?.focus();
      return;
    }
    clearIntakeDraft();
    router.push(`/organizations/${created.organization.id}`);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const next = goal.trim();
    if (next.length < 10) {
      setError("Goal must be at least 10 characters");
      areaRef.current?.focus();
      return;
    }

    if (!brief) {
      captureBrief(next);
      if (isLoaded && !isSignedIn) requestSignIn();
      return;
    }

    if (!isLoaded) return;
    if (!isSignedIn) {
      requestSignIn();
      return;
    }
    if (!showRoles) return;

    await startOrganization(next);
  }

  const waitingOnRoles = Boolean(brief && isSignedIn && !showRoles);
  const needsSignIn = Boolean(brief && isLoaded && !isSignedIn);
  const submitLabel = pending
    ? "Starting Rivera"
    : waitingOnRoles
      ? "Reading your brief"
      : showRoles
        ? "Start Rivera"
        : "Continue";

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-[720px]" aria-busy={pending}>
      <SignInButton mode="modal" forceRedirectUrl={AFTER_SIGN_IN} fallbackRedirectUrl={AFTER_SIGN_IN}>
        <button ref={signInRef} type="button" className="sr-only" tabIndex={-1} aria-hidden="true">
          Sign in to start a sandbox
        </button>
      </SignInButton>

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
            {needsSignIn
              ? "Sign in to start your sandbox"
              : waitingOnRoles
                ? "Using this as launch context…"
                : showRoles
                  ? "Enter to start · Shift + Enter for a new line"
                  : "Enter to continue · Shift + Enter for a new line"}
          </p>
          <button
            type="submit"
            disabled={pending || waitingOnRoles || goal.trim().length < 10}
            aria-label={submitLabel}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#221d2a] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff] disabled:opacity-40"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {brief ? (
        <p className="mt-3 text-sm leading-6 text-[#928c97]">
          Saved as context. Rivera will use this brief for research, hiring, and the rest of the run.
        </p>
      ) : null}

      {error ? (
        <p id="goal-error" className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {showRoles ? (
        <fieldset
          ref={rolesRef}
          className="mt-6 rounded-[12px] border border-white/10 bg-[#1a1720] p-4"
        >
          <legend className="px-1 text-xs uppercase tracking-wide text-[#928c97]">Roles to shortlist</legend>
          <p className="text-xs text-[#928c97]">Inferred from your prompt. Change them before you start.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HIRING_ROLE_PRESETS.map((role) => {
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
      ) : null}

      {!brief ? (
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
      ) : null}
    </form>
  );
}
