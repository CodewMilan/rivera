import Link from "next/link";
import { AppMain } from "@/components/site/site-chrome";

export default function OrganizationNotFound() {
  return (
    <AppMain>
      <h1 className="text-[49px] font-normal leading-[60px] tracking-[-1.62px] text-[#c2b8ff]">
        Organization not found
      </h1>
      <p className="mt-3 max-w-xl text-[19px] leading-[29.4px] text-[#928c97]">
        It may have been deleted, or this server is not reading the same database.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-[5px] border border-white bg-white px-[21px] py-[6px] text-[15.6px] leading-[36.96px] text-[#221d2a]"
      >
        Back to intake
      </Link>
    </AppMain>
  );
}
