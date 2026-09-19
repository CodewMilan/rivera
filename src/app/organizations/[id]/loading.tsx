export default function OrganizationLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
