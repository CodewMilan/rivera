"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { figma } from "@/lib/figma-assets";
import { FigmaAsset } from "@/components/site/figma-asset";
import { AuthActions, AuthNavLink } from "@/components/site/auth-controls";
import { OutlineButton, SolidButton } from "@/components/site/buttons";
import { DemoThumb, RiveraMark } from "@/components/site/rivera-mark";

function isAuthPath(pathname: string) {
  return pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const auth = isAuthPath(usePathname());

  return (
    <div className="relative min-h-screen bg-[#0c0a10] text-[#f4f2f0]">
      {auth ? null : <AlertBanner />}
      <div className="relative overflow-hidden">
        <StarField />
        <SiteHeader />
        {children}
        {auth ? <AuthFooter /> : <SiteFooter />}
      </div>
    </div>
  );
}

export function AppMain({ children }: { children: ReactNode }) {
  return (
    <main className="relative z-10 mx-auto w-full max-w-[1370px] px-[30px] pb-24 pt-8">{children}</main>
  );
}

function AlertBanner() {
  return (
    <div className="flex flex-col items-center bg-[#c2b8ff]" data-name="div.alert_banner">
      <a
        href="/#features"
        className="flex w-full max-w-[1370px] items-center justify-center gap-[13.99px] px-[30px] py-[8px] rounded-[1px]"
      >
        <span className="rounded-[4px] bg-[#f4f2f0] px-[7px] text-[12px] capitalize leading-[24px] text-[#0c0a10]">
          Post
        </span>
        <span className="text-[15px] leading-[24px] text-[#0c0a10]">
          Chat with the Rivera launch index — research, planning, and approvals.{" "}
          <span className="text-[#6a53fe]">Learn more</span>
        </span>
      </a>
      <div className="h-[40px] w-full rounded-tl-[40px] rounded-tr-[40px] bg-[#0c0a10]" data-name="div.black-divider-small" />
    </div>
  );
}

function SiteHeader() {
  const pathname = usePathname();
  const onPricing = pathname === "/pricing";

  return (
    <header className="relative z-20 mx-auto flex h-[64px] w-full max-w-[1370px] items-center justify-between px-[30px]" data-name="Banner">
      <Link href="/" className="flex items-center" aria-label="Rivera home">
        <RiveraMark />
      </Link>
      <nav className="hidden items-center md:flex" aria-label="Primary">
        <Link href="/#features" className="flex items-center gap-[4.99px] px-[15px] py-[20px] text-[14px] leading-[24px] text-[#f4f2f0]">
          Features
          <span className="-scale-y-100">
            <FigmaAsset src={figma.chevron} alt="" width={12} height={12} />
          </span>
        </Link>
        <FigmaAsset src={figma.littleStar} alt="" width={10} height={10} className="opacity-[0.28]" />
        <Link
          href="/pricing"
          aria-current={onPricing ? "page" : undefined}
          className={onPricing ? "px-[15px] text-[14px] leading-[24px] text-[#c2b8ff]" : "px-[15px] text-[14px] leading-[24px] text-[#f4f2f0]"}
        >
          Pricing
        </Link>
        <Link href="/#grid" className="px-[15px] text-[15px] leading-[24px] text-[#f4f2f0]">
          Docs
        </Link>
        <AuthNavLink />
      </nav>
      <AuthActions />
    </header>
  );
}

function StarField() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[800px] overflow-hidden" data-name="div.stars-container">
      <div className="absolute right-[-5%] top-[-20%] flex items-start justify-center">
        <FigmaAsset src={figma.starAxis2} alt="" width={738.806} height={737.986} />
      </div>
      <div className="absolute right-[-5%] top-[-10%] flex items-start justify-center">
        <FigmaAsset src={figma.starAxis3} alt="" width={656.716} height={655.896} />
      </div>
      <div className="absolute right-[-5%] top-0 flex items-start justify-center">
        <FigmaAsset src={figma.starAxis4} alt="" width={574.627} height={573.808} />
      </div>
    </div>
  );
}

function AuthFooter() {
  return (
    <footer className="relative z-10 px-[30px] py-8">
      <p className="text-center text-[13px] leading-[24px] text-[#928c97]">© 2026 Rivera</p>
    </footer>
  );
}

function SiteFooter() {
  return (
    <footer className="relative z-10 bg-[#0c0a10] px-[65px] pb-[74.88px] pt-[149.59px]" data-name="Footer">
      <div className="mx-auto max-w-[1310px]">
        <h2 className="max-w-[1114px] text-[76px] font-normal leading-[84px] tracking-[-3.36px] text-[#c2b8ff]">
          Get back to building your product.
          <span className="block text-[#f4f2f0]">Let Rivera handle the rest.</span>
        </h2>
        <div className="mt-[21px] flex flex-wrap items-center gap-[10px]">
          <SolidButton href="/#intake">Try a sandbox</SolidButton>
          <OutlineButton href="/#features">
            <DemoThumb />
            Watch the demo
          </OutlineButton>
        </div>
        <div className="mt-[75px] flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] leading-[24px] text-[#928c97]">© 2026 Rivera</p>
          <div className="flex items-center gap-[21px] pl-[21px]">
            <a href="https://www.linkedin.com" aria-label="LinkedIn">
              <FigmaAsset src={figma.iconLinkedin} alt="" width={21} height={21} />
            </a>
            <a href="https://x.com" aria-label="X">
              <FigmaAsset src={figma.iconTwitter} alt="" width={21} height={21} />
            </a>
            <Link href="/pricing" className="text-[13px] leading-[24px] text-[#928c97]">
              Pricing
            </Link>
            <Link href="/#features" className="text-[13px] leading-[24px] text-[#928c97]">
              Blog
            </Link>
            <Link href="/#intake" className="text-[13px] leading-[24px] text-[#928c97]">
              Jobs
            </Link>
            <Link href="/#grid" className="text-[12px] leading-[24px] text-[#928c97]">
              Terms of Use
            </Link>
            <Link href="/#grid" className="text-[13px] leading-[24px] text-[#928c97]">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
