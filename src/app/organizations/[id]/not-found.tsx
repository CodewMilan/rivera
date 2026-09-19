import Link from "next/link";

export default function OrganizationNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4">
      <h1 className="text-4xl font-semibold tracking-tight">Organization not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        It may have been deleted, or this server is not reading the same database.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 w-fit items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to intake
      </Link>
    </main>
  );
}
