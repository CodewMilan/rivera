import type { ReactNode } from "react";
import { FigmaAsset } from "@/components/site/figma-asset";
import { OutlineButton, SolidButton } from "@/components/site/buttons";
import { figma } from "@/lib/figma-assets";

const PLANS = [
  {
    name: "Sandbox",
    price: "$0",
    cadence: "to try the org",
    lead: "See the whole company on one idea.",
    body: "One organization. One live run, or unlimited demo data. Every agent role is there. Publish stays off.",
    items: [
      "Full agent org, visible end to end",
      "Approvals on every risky action",
      "Demo fixtures or one live run",
      "No model or media spend",
    ],
    cta: <OutlineButton href="/#intake">Try a sandbox</OutlineButton>,
    emphasized: false,
  },
  {
    name: "Studio",
    price: "$39",
    cadence: "/ month",
    lead: "Run a real launch with a hard cap.",
    body: "Unlimited runs. Live research, planning, and the social pipeline. You set the budget. Rivera will not cross it.",
    items: [
      "Everything in Sandbox",
      "Unlimited live runs",
      "Research, strategy, and social pipeline",
      "Hard spend cap with approval pauses",
      "Artifact export and audit trail",
    ],
    cta: <SolidButton href="/sign-up">Start Studio</SolidButton>,
    emphasized: true,
  },
] as const;

const METERED = [
  {
    icon: figma.iconCode,
    title: "Models",
    body: "Agent LLM calls count against the org budget you set. Nothing runs past it.",
  },
  {
    icon: figma.iconSearch,
    title: "Research",
    body: "Source fetches and evaluation work are metered the same way as the rest of the run.",
  },
  {
    icon: figma.iconCost,
    title: "Media",
    body: "Image and video generation only after you approve. Cost is visible before it spends.",
  },
];

const QUESTIONS = [
  {
    title: "Is model spend included?",
    body: "Studio is the platform. Research, models, and media spend against the budget on the organization — never past the number you set.",
  },
  {
    title: "What is a sandbox?",
    body: "A full org with agents, tasks, and approvals. Use demo data, or run once for real to see the pipeline before you pay.",
  },
  {
    title: "Can I leave publish off?",
    body: "Yes. Publish stays off until you approve. Auto-publish is opt-in and off by default.",
  },
  {
    title: "What happens at the cap?",
    body: "The run pauses and asks. Rivera does not keep spending to finish a task once the budget is gone.",
  },
  {
    title: "Can I take my work with me?",
    body: "Yes. Export artifacts and cut access any time. Your product and data remain yours.",
  },
  {
    title: "Do you train on my runs?",
    body: "No. Organizations, artifacts, and connected mail stay yours. We do not train on them.",
  },
];

export function Pricing() {
  return (
    <div className="relative z-10">
      <Hero />
      <Plans />
      <Metered />
      <Questions />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-[1370px] flex-col px-[30px] pt-[48px]">
      <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Pricing</p>
      <h1 className="mt-1 max-w-[920px] text-[48px] font-normal leading-[52px] tracking-[-2.2px] text-[#c2b8ff] sm:text-[64px] sm:leading-[70px] sm:tracking-[-2.8px] md:text-[76px] md:leading-[84px] md:tracking-[-3.36px]">
        Start in a sandbox.
        <span className="block text-[#f4f2f0]">Pay when the launch is real.</span>
      </h1>
      <p className="mt-[20px] max-w-[640px] text-[19px] leading-[29.4px] tracking-[0.21px] text-[#928c97]">
        The platform is simple. Model, research, and media spend against the budget you set — and
        never past it.
      </p>
    </section>
  );
}

function Plans() {
  return (
    <section className="mx-auto mt-16 flex w-full max-w-[1370px] flex-col gap-[16px] px-[30px] md:mt-24">
      <div className="grid gap-[16px] lg:grid-cols-2">
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} {...plan} />
        ))}
        <article className="relative overflow-hidden rounded-[10px] bg-[rgba(39,38,45,0.8)] lg:col-span-2">
          <div className="grid items-start gap-10 p-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex max-w-[640px] flex-col">
              <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">Company</p>
              <h2 className="mt-1 text-[30px] font-normal leading-[36px] text-[#f4f2f0]">
                More than one launch at a time.
                <span className="text-[rgba(146,140,151,0.9)]">
                  {" "}
                  Same product, invoicing, and a named contact. Custom spend and model limits.
                </span>
              </h2>
              <div className="mt-8">
                <OutlineButton href="/#intake">Talk to us</OutlineButton>
              </div>
            </div>
            <ul className="flex list-none flex-col gap-[14px] p-0 pt-1">
              {[
                "Multiple organizations",
                "Invoice billing",
                "Custom spend and model limits",
                "Shared review queue",
              ].map((item) => (
                <LineItem key={item}>{item}</LineItem>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}

function PlanCard({
  name,
  price,
  cadence,
  lead,
  body,
  items,
  cta,
  emphasized,
}: {
  name: string;
  price: string;
  cadence: string;
  lead: string;
  body: string;
  items: readonly string[];
  cta: ReactNode;
  emphasized: boolean;
}) {
  return (
    <article
      className={
        emphasized
          ? "flex flex-col rounded-[10px] border border-[rgba(194,184,255,0.22)] bg-[rgba(39,38,45,0.8)] p-10"
          : "flex flex-col rounded-[10px] bg-[rgba(39,38,45,0.8)] p-10"
      }
    >
      <p className="text-[13.4px] leading-[30.24px] text-[#c2b8ff]">{name}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-[49px] font-normal leading-[60px] tracking-[-1.62px] text-[#f4f2f0]">
          {price}
        </p>
        <p className="text-[16px] leading-[27px] tracking-[0.18px] text-[#928c97]">{cadence}</p>
      </div>
      <h2 className="mt-6 text-[29px] font-normal leading-[36px] text-[#f4f2f0]">
        {lead} <span className="text-[rgba(146,140,151,0.9)]">{body}</span>
      </h2>
      <ul className="mt-8 flex list-none flex-col gap-[14px] p-0">
        {items.map((item) => (
          <LineItem key={item}>{item}</LineItem>
        ))}
      </ul>
      <div className="mt-auto pt-10">{cta}</div>
    </article>
  );
}

function LineItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-[12px] text-[16px] leading-[27px] tracking-[0.18px] text-[#928c97]">
      <FigmaAsset
        src={figma.littleStar}
        alt=""
        width={10}
        height={10}
        className="mt-[8px] shrink-0 opacity-70"
      />
      <span>{children}</span>
    </li>
  );
}

function Metered() {
  return (
    <section className="mx-auto mt-24 w-full max-w-[1370px] px-[30px] md:px-[65px]">
      <div className="flex max-w-[660px] flex-col gap-[20px]">
        <h2 className="text-[40px] font-normal leading-[48px] tracking-[-1.2px] text-[#f4f2f0] md:text-[51px] md:font-extralight md:leading-[60px] md:tracking-[-1.62px]">
          You set the cap.
        </h2>
        <p className="text-[19px] leading-[29.4px] tracking-[0.21px] text-[#928c97]">
          Research, models, and media are metered against the organization budget. When a run would
          pass it, Rivera stops and asks. Founder time comes back. Surprise spend does not.
        </p>
      </div>
      <div className="mt-[52px] grid gap-x-[65.5px] gap-y-8 md:grid-cols-3">
        {METERED.map((item) => (
          <div key={item.title} className="max-w-[371.16px] pb-[32px]">
            <div className="inline-flex overflow-hidden rounded-[4px] bg-[#1f1c26]">
              <FigmaAsset src={item.icon} alt="" width={40} height={40} />
            </div>
            <h3 className="mt-[18px] text-[24px] font-normal leading-[25px] text-[#f4f2f0]">
              {item.title}
            </h3>
            <p className="mt-[16px] text-[16px] leading-[27px] tracking-[0.18px] text-[#928c97]">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Questions() {
  return (
    <section className="mx-auto mt-24 w-full max-w-[1370px] px-[30px] pb-8">
      <h2 className="max-w-[982.5px] text-[40px] font-normal leading-[48px] tracking-[-1.2px] text-[#c2b8ff] md:text-[49px] md:leading-[60px] md:tracking-[-1.62px]">
        Questions, answered.
        <span className="text-[#f4f2f0]"> Before you start a run.</span>
      </h2>
      <div className="mt-16 grid gap-x-[65.5px] gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {QUESTIONS.map((item) => (
          <div key={item.title} className="max-w-[371.16px] pb-[32px]">
            <h3 className="text-[24px] font-normal leading-[28px] text-[#f4f2f0]">{item.title}</h3>
            <p className="mt-[16px] text-[16px] leading-[27px] tracking-[0.18px] text-[#928c97]">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
