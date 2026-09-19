import type { ReactNode } from "react";

export function AuthBoard({ children }: { children: ReactNode }) {
  return (
    <main className="relative z-10 flex min-h-[calc(100dvh-148px)] items-center justify-center px-[30px] py-16">
      <div className="w-full max-w-[420px]">{children}</div>
    </main>
  );
}
