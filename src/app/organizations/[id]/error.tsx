"use client";

export default function OrganizationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4">
      <h1 className="text-4xl font-semibold tracking-tight">Could not load this organization</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        Retry
      </button>
    </main>
  );
}
