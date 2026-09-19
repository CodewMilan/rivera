import { figma } from "@/lib/figma-assets";
import { FigmaAsset } from "@/components/site/figma-asset";

export function RiveraMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <FigmaAsset src={figma.mark} alt="" width={36} height={39.47} />
      <span className={compact ? "text-[15px] tracking-[-0.2px] text-white" : "text-[22px] tracking-[-0.4px] text-white"}>
        Rivera
      </span>
    </span>
  );
}

export function DemoThumb() {
  return (
    <span className="relative inline-flex h-[37.2px] w-[65.11px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#16131c]">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(194,184,255,0.35),transparent_70%)]" />
      <span className="relative flex size-[22px] items-center justify-center rounded-full border border-white/75">
        <span className="ml-[2px] border-y-[4px] border-l-[7px] border-y-transparent border-l-white" />
      </span>
    </span>
  );
}
