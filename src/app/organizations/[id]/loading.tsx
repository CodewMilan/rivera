import { AppMain } from "@/components/site/site-chrome";

export default function OrganizationLoading() {
  return (
    <AppMain>
      <div className="space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-[10px] bg-[#1f1c26]" />
        <div className="h-16 w-2/3 animate-pulse rounded-[10px] bg-[#1f1c26]" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-[10px] bg-[#1f1c26]" />
          ))}
        </div>
      </div>
    </AppMain>
  );
}
