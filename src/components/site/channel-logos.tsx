import type { ReactNode } from "react";

export type ChannelId = "x" | "linkedin" | "instagram" | "tiktok";

const TIKTOK_NOTE =
  "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";

export function ChannelLogo({ id }: { id: ChannelId }) {
  switch (id) {
    case "x":
      return <XMark />;
    case "linkedin":
      return <LinkedInMark />;
    case "instagram":
      return <InstagramMark />;
    case "tiktok":
      return <TikTokMark />;
  }
}

function Tile({ fill, children }: { fill: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" className="pointer-events-none size-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={fill} />
      {children}
    </svg>
  );
}

function XMark() {
  return (
    <Tile fill="#000">
      <path
        fill="#fff"
        transform="translate(6 6) scale(0.83)"
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
      />
    </Tile>
  );
}

function LinkedInMark() {
  return (
    <Tile fill="#0A66C2">
      <path
        fill="#fff"
        d="M11.1 13.05h2.18v7.7H11.1v-7.7Zm1.09-3.48c.7 0 1.26.56 1.26 1.26 0 .69-.56 1.25-1.26 1.25a1.25 1.25 0 1 1 0-2.51ZM14.7 13.05h2.09v1.05h.03c.29-.55.99-1.13 2.04-1.13 2.18 0 2.58 1.43 2.58 3.3v3.48h-2.18v-3.09c0-.74-.01-1.68-1.03-1.68-1.03 0-1.18.8-1.18 1.63v3.14H14.7v-7.7Z"
      />
    </Tile>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 32 32" className="pointer-events-none size-8 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="ig-logo-grad" x1="6" y1="28" x2="26" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F58529" />
          <stop offset="0.45" stopColor="#DD2A7B" />
          <stop offset="1" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ig-logo-grad)" />
      <rect x="9" y="9" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16" cy="16" r="3.4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="20.6" cy="11.4" r="1" fill="#fff" />
    </svg>
  );
}

function TikTokMark() {
  return (
    <Tile fill="#010101">
      <g transform="translate(4.2 4.2) scale(0.98)">
        <path d={TIKTOK_NOTE} fill="#25F4EE" transform="translate(-1.15 0.7)" />
        <path d={TIKTOK_NOTE} fill="#FE2C55" transform="translate(1.15 -0.7)" />
        <path d={TIKTOK_NOTE} fill="#fff" />
      </g>
    </Tile>
  );
}
