import type { ReactNode } from "react";
import { FigmaAsset } from "@/components/site/figma-asset";
import { OutlineButton, SolidButton } from "@/components/site/buttons";
import {
  FeaturePreviewComment,
  FeaturePreviewEditor,
  FeaturePreviewPipeline,
  FeaturePreviewPlan,
  FeaturePreviewPromote,
  LaunchTimeline,
} from "@/components/site/product-mocks";
import { figma } from "@/lib/figma-assets";

const ORG = [
  {
    icon: figma.iconSearch,
    title: "Research",
    body: "Market maps, competitors, and sourced evidence. Claims without URLs do not survive review.",
  },
  {
    icon: figma.iconCode,
    title: "Engineering",
    body: "Architecture, schemas, and an MVP plan you can actually build against. Effort is estimated, not guessed.",
  },
  {
    icon: figma.iconCost,
    title: "Finance",
    body: "Cost, pricing, and a hard spend cap. When a run would cross it, Rivera stops and asks.",
  },
  {
    icon: figma.iconOffsite,
    title: "Marketing",
    body: "Positioning, naming, and launch messaging. Distribution is a plan, not a slogan.",
  },
  {
    icon: figma.iconLock,
    title: "Social",
    body: "Captions, scripts, and media drafts. Publish stays off until you approve.",
  },
  {
    icon: figma.iconNoLockin,
    title: "Evaluator",
    body: "Scores quality, flags unsupported claims, and sends work back when it is not done.",
  },
] as const;

const GATES = [
  {
    icon: figma.iconLock,
    title: "Human gates",
    body: "Risky actions wait. Publish, spend, and anything irreversible stay behind an approval.",
  },
  {
    icon: figma.iconSearch,
    title: "Audit trail",
    body: "Every research note, decision, and artifact is kept. You can see who did what, and why.",
  },
  {
    icon: figma.iconCost,
    title: "Hard cap",
    body: "Model, research, and media spend against the number you set. Rivera does not keep going past it.",
  },
] as const;

export function Features() {
  return (
    <div className="relative z-10">
      <Hero />
      <Cards />
      <Org />
      <Gantt />
      <Gates />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-[1370px] flex-col px-[30px] pt-[48px]">
      <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Features</p>
      <h1 className="mt-1 max-w-[920px] text-[48px] font-normal leading-[52px] tracking-[-2.2px] text-[#c2b8ff] sm:text-[64px] sm:leading-[70px] sm:tracking-[-2.8px] md:text-[76px] md:leading-[84px] md:tracking-[-3.36px]">
        One goal.
        <span className="block text-[#f4f2f0]">A full product org.</span>
      </h1>
      <p className="mt-[20px] max-w-[640px] text-[19px] leading-[29.4px] tracking-[0.21px] text-[#928c97]">
        Rivera staffs research, planning, and production for the launch. You review the work. You
        decide what ships.
      </p>
      <div className="mt-[21px] flex flex-wrap items-center gap-[10px]">
        <SolidButton href="/#intake">Try a sandbox</SolidButton>
        <OutlineButton href="/pricing">See pricing</OutlineButton>
      </div>
    </section>
  );
}

function Cards() {
  return (
    <section className="mx-auto mt-16 flex w-full max-w-[1370px] flex-col gap-[48px] px-[30px] md:mt-24">
      <h2 className="max-w-[982.5px] text-[40px] font-normal leading-[48px] tracking-[-1.2px] text-[#c2b8ff] md:text-[49px] md:leading-[60px] md:tracking-[-1.62px]">
        Your AI product organization is here.
        <span className="text-[#f4f2f0]">
          {" "}
          Your team will love using it. You&apos;ll love not building, supporting, or maintaining it.
        </span>
      </h2>
      <div className="grid gap-[16px] lg:grid-cols-2">
        <FeatureCard
          title="Research and specialist agents"
          body="created with every goal. Collaborate with research, strategy, engineering, and marketing in one run."
          href="/#intake"
        >
          <FeaturePreviewComment />
        </FeatureCard>
        <FeatureCard
          title="Live CEO planning"
          body="does the heavy lifting for you. One goal continuously becomes tasks, with live LLM output you can inspect."
          href="/#intake"
        >
          <FeaturePreviewPlan />
        </FeatureCard>
        <FeatureCard
          title="Debate and approvals"
          body="offers configurable human gates for risky actions, budget spend, and anything that should not auto-run."
          href="/#intake"
        >
          <FeaturePreviewPipeline />
        </FeatureCard>
        <FeatureCard
          title="Social campaign review"
          body="is a click away. Rest assured, publish stays off until you approve, and you control who can ship."
          href="/#intake"
        >
          <FeaturePreviewPromote />
        </FeatureCard>
        <article className="relative overflow-hidden rounded-[10px] bg-[rgba(39,38,45,0.8)] lg:col-span-2">
          <div className="grid items-start gap-8 p-10 lg:grid-cols-2">
            <div className="flex max-w-[615px] flex-col gap-[30px]">
              <h3 className="text-[30px] font-normal leading-[36px] text-[#f4f2f0]">
                One publish path{" "}
                <span className="text-[rgba(146,140,151,0.9)]">
                  lets you review captions, media, and the final report before anything goes live. One click when you are ready.
                </span>
              </h3>
              <a
                href="/#intake"
                className="text-[18px] font-light leading-[24px] text-[#c2b8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
              >
                Learn more ↗
              </a>
            </div>
            <FeaturePreviewEditor />
          </div>
        </article>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  body,
  href,
  children,
}: {
  title: string;
  body: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <article className="flex min-h-[520px] flex-col rounded-[10px] bg-[rgba(39,38,45,0.8)] p-10">
      <h3 className="text-[29px] font-normal leading-[36px] text-[#f4f2f0]">
        {title} <span className="text-[rgba(146,140,151,0.9)]">{body}</span>
      </h3>
      <a
        href={href}
        className="mt-6 text-[18px] font-light leading-[24px] text-[#c2b8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2b8ff]"
      >
        Learn more ↗
      </a>
      <div className="mt-auto pt-8">{children}</div>
    </article>
  );
}

function Org() {
  return (
    <section className="mx-auto mt-24 w-full max-w-[1370px] px-[30px] md:px-[65px]">
      <div className="flex max-w-[660px] flex-col gap-[20px]">
        <h2 className="text-[40px] font-normal leading-[48px] tracking-[-1.2px] text-[#f4f2f0] md:text-[51px] md:font-extralight md:leading-[60px] md:tracking-[-1.62px]">
          Staffed the moment you submit a goal.
        </h2>
        <p className="text-[19px] leading-[29.4px] tracking-[0.21px] text-[#928c97]">
          The CEO plans. Specialists research, debate, and draft. You keep the irreversible
          decisions.
        </p>
      </div>
      <div className="mt-[52px] grid gap-x-[65.5px] gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {ORG.map((item) => (
          <Value key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

function Gantt() {
  return (
    <section className="mx-auto mt-24 flex w-full max-w-[1370px] flex-col gap-[48px] px-[30px]">
      <h2 className="max-w-[982.5px] text-[40px] font-normal leading-[48px] tracking-[-1.2px] text-[#c2b8ff] md:text-[50px] md:leading-[60px] md:tracking-[-1.62px]">
        Don&apos;t build all this stuff yourself.
        <span className="text-[#f4f2f0]"> Rivera gets launch work off your roadmap.</span>
      </h2>
      <LaunchTimeline />
    </section>
  );
}

function Gates() {
  return (
    <section className="mx-auto mt-24 w-full max-w-[1370px] px-[30px] pb-8">
      <h2 className="max-w-[982.5px] text-[40px] font-normal leading-[48px] tracking-[-1.2px] text-[#c2b8ff] md:text-[49px] md:leading-[60px] md:tracking-[-1.62px]">
        Drafting is allowed.
        <span className="text-[#f4f2f0]"> Publishing is not, until you say so.</span>
      </h2>
      <div className="mt-16 grid gap-x-[65.5px] gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {GATES.map((item) => (
          <Value key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

function Value({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="max-w-[371.16px] pb-[32px]">
      <div className="inline-flex overflow-hidden rounded-[4px] bg-[#1f1c26]">
        <FigmaAsset src={icon} alt="" width={40} height={40} />
      </div>
      <h3 className="mt-[18px] text-[24px] font-normal leading-[25px] text-[#f4f2f0]">{title}</h3>
      <p className="mt-[16px] text-[16px] leading-[27px] tracking-[0.18px] text-[#928c97]">{body}</p>
    </div>
  );
}
