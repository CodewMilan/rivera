import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Callout({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "warn";
}) {
  return (
    <aside
      className={cn(
        "my-6 rounded-[10px] border px-4 py-3 text-[15px] leading-[24px]",
        tone === "warn"
          ? "border-[rgba(224,138,125,0.45)] bg-[rgba(224,138,125,0.08)] text-[#f4f2f0]"
          : "border-[rgba(194,184,255,0.28)] bg-[rgba(194,184,255,0.08)] text-[#f4f2f0]",
      )}
    >
      {title ? (
        <p className={cn("text-[13px] uppercase tracking-wide", tone === "warn" ? "text-[#e08a7d]" : "text-[#c2b8ff]")}>
          {title}
        </p>
      ) : null}
      <div className={title ? "mt-1 text-[#928c97]" : "text-[#928c97]"}>{children}</div>
    </aside>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="my-6 overflow-x-auto rounded-[10px] border border-[rgba(194,184,255,0.22)] bg-[#1f1c26] p-4 text-[13px] leading-[22px] text-[#f4f2f0]">
      <code>{children}</code>
    </pre>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[4px] bg-[#1f1c26] px-1.5 py-0.5 text-[13px] text-[#c2b8ff]">{children}</code>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-6 list-decimal space-y-3 pl-5 text-[16px] leading-[27px] text-[#928c97]">{children}</ol>;
}

export function Bullet({ children }: { children: ReactNode }) {
  return <ul className="my-6 list-disc space-y-2 pl-5 text-[16px] leading-[27px] text-[#928c97]">{children}</ul>;
}

export function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-[10px] border border-[rgba(194,184,255,0.22)]">
      <table className="w-full min-w-[520px] border-collapse text-left text-[14px] leading-[22px]">
        <thead className="bg-[#1f1c26] text-[#c2b8ff]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-normal">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[#928c97]">
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-[rgba(194,184,255,0.14)]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top text-[#f4f2f0]/90">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
