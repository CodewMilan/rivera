import type { ReactNode } from "react";

export function AuthBoard({ children }: { children: ReactNode }) {
  return (
    <main className="relative z-10 flex justify-center px-[30px] pb-16 pt-10">
      <div className="w-full max-w-[420px]">{children}</div>
    </main>
  );
}
