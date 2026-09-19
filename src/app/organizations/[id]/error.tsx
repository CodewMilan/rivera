"use client";

import { AppMain } from "@/components/site/site-chrome";

export default function OrganizationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppMain>
      <h1 className="text-[49px] font-normal leading-[60px] tracking-[-1.62px] text-[#c2b8ff]">
        Could not load this organization
      </h1>
      <p className="mt-3 max-w-xl text-[19px] leading-[29.4px] text-[#928c97]">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center justify-center rounded-[5px] border border-white bg-white px-[21px] py-[6px] text-[15.6px] leading-[36.96px] text-[#221d2a]"
      >
        Retry
      </button>
    </AppMain>
  );
}
