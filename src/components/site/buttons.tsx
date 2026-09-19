import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const solid =
  "inline-flex items-center justify-center rounded-[5px] border border-white bg-white px-[21px] py-[6px] text-[15.6px] leading-[36.96px] text-[#221d2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]";
const outline =
  "inline-flex items-center justify-center gap-[8.8px] rounded-[5px] border border-[#c2b8ff] px-[21px] py-[6px] text-[15.6px] leading-[36.96px] text-[#c2b8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]";
const navSolid =
  "inline-flex items-center justify-center rounded-[5px] border border-white bg-white px-[9.63px] py-px text-[13.4px] leading-[30.24px] text-[#221d2a]";
const navOutline =
  "inline-flex items-center justify-center rounded-[5px] border border-[#c2b8ff] px-[9.63px] py-px text-[13.4px] leading-[30.24px] text-[#c2b8ff]";

export function SolidButton({
  href,
  children,
  className,
  type = "button",
  disabled,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  if (href) {
    return (
      <Link href={href} className={cn(solid, className)}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} className={cn(solid, "disabled:opacity-60", className)}>
      {children}
    </button>
  );
}

export function OutlineButton({
  href,
  children,
  className,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={cn(outline, className)}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cn(outline, className)}>
      {children}
    </button>
  );
}

export function NavSolidLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={navSolid}>
      {children}
    </Link>
  );
}

export function NavOutlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={navOutline}>
      {children}
    </Link>
  );
}
