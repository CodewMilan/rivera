import { IntakeForm } from "@/components/intake-form";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16 md:px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-primary">Rivera</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
        Give it a goal. Watch an organization go to work.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        Rivera is not a chatbot. Phase 1 saves the goal, budget, and deadline.
        Agents and launch work come later.
      </p>
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <IntakeForm />
      </div>
    </main>
  );
}
