import { IntakeForm } from "@/components/intake-form";
import { FigmaAsset } from "@/components/site/figma-asset";
import { OutlineButton, SolidButton } from "@/components/site/buttons";
import { figma } from "@/lib/figma-assets";

export function Landing() {
  return (
    <div className="relative z-10">
      <Hero />
      <Testimonials />
      <DevopsCopy />
      <FeatureCards />
      <Gantt />
      <ValueGrid />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-[1370px] flex-col gap-[96.01px] px-[30px] pt-[48px]">
      <div className="flex max-w-[816px] flex-col gap-[25.59px]">
        <h1 className="text-[104px] font-normal leading-[104.5px] tracking-[-6.82px] text-[#c2b8ff]">
          Easy-mode <span className="text-[#f4f2f0]">for</span>
          <span className="block text-[#f4f2f0]">Product Launch</span>
        </h1>
        <p className="max-w-[887px] text-[23.6px] font-extralight leading-[32px] tracking-[-0.256px] text-white">
          Rivera automates <span className="text-[#c2b8ff]">research</span>,{" "}
          <span className="text-[#c2b8ff]">planning</span>, and{" "}
          <span className="text-[#c2b8ff]">production</span> in your{" "}
          <span className="inline-flex items-center gap-[2.55px] align-middle">
            <FigmaAsset src={figma.aws} alt="" width={25.6} height={25.6} />
            <span className="text-[25.6px] text-white">AWS</span>
          </span>{" "}
          or{" "}
          <span className="inline-flex items-center gap-[2.56px] align-middle">
            <FigmaAsset src={figma.gcp} alt="" width={25.6} height={25.6} />
            <span className="text-[25.6px] text-white">GCP</span>
          </span>{" "}
          account. More power, less hassle.
        </p>
        <div className="flex flex-wrap items-center gap-[10px]">
          <SolidButton href="#intake">Try a sandbox</SolidButton>
          <OutlineButton href="#features">
            <FigmaAsset src={figma.lilthumb} alt="" width={65.11} height={37.2} />
            Watch the demo
          </OutlineButton>
        </div>
      </div>
      <div
        className="h-auto max-w-[1370px] overflow-hidden rounded-[20px] shadow-[0px_0px_16px_4px_rgba(194,184,255,0.08)]"
        data-name="dashboard"
      >
        <FigmaAsset src={figma.dashboard} alt="Rivera organization dashboard" className="block w-full" />
      </div>
      <div id="intake" className="scroll-mt-24 rounded-[10px] bg-[rgba(39,38,45,0.8)] p-10">
        <h2 className="text-[29px] font-normal leading-[36px] text-[#f4f2f0]">Create an organization</h2>
        <p className="mt-2 text-[18px] leading-[24px] text-[#c2b8ff]">Phase 1 saves the goal. Agents start later.</p>
        <div className="mt-8">
          <IntakeForm />
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="relative mt-[80px] overflow-hidden px-[35px] pt-[112px] pb-[16px]" data-name="Section">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <FigmaAsset src={figma.testimonialBg} alt="" className="absolute left-0 top-0 h-[106.36%] w-full" />
      </div>
      <div className="relative mx-auto flex w-full max-w-[1370px] flex-col gap-[80px] px-[30px]">
        <div className="flex flex-col justify-between gap-16 lg:flex-row">
          <Quote
            quote="“Rivera sped up all of our workflows”"
            rest="The Rounds' Journey to a Robust QA Process with Rivera."
            name="Griffin Tschurwald"
            headshot={figma.roundsHeadshot}
            logo={figma.roundsLogo}
            logoWidth={95}
            logoHeight={12.44}
          />
          <Quote
            quote="“Rivera allows us to harness the capabilities of AWS in the simplest possible way”"
            rest="Ultralight's Move from PaaS to the Cloud with Rivera."
            name="Shiv Ghai"
            headshot={figma.ultralightHeadshot}
            logo={figma.ultralightWordmark}
            logoWidth={80}
            logoHeight={17.5}
          />
        </div>
        <div className="flex flex-col gap-[16px]">
          <p className="text-[12px] leading-[24px] text-[rgba(244,242,240,0.6)]">Many more growing teams trust Rivera</p>
          <div className="flex flex-wrap items-center gap-[32px] pb-[8px]">
            <FigmaAsset src={figma.logoPattern} alt="Pattern" width={110} height={23.64} />
            <FigmaAsset src={figma.logoCaredge} alt="CarEdge" width={110} height={27.72} />
            <FigmaAsset src={figma.logoLuxe} alt="Luxe" width={88.19} height={31.98} />
            <FigmaAsset src={figma.logoUltralight} alt="Ultralight" width={110} height={31.55} />
            <FigmaAsset src={figma.logoCubby} alt="Cubby" width={110} height={21.23} />
            <FigmaAsset src={figma.logoSuno} alt="Suno" width={95.41} height={31.98} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Quote({
  quote,
  rest,
  name,
  headshot,
  logo,
  logoWidth,
  logoHeight,
}: {
  quote: string;
  rest: string;
  name: string;
  headshot: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
}) {
  return (
    <div className="flex max-w-[635px] flex-1 flex-col gap-[32px]">
      <div>
        <p className="text-[30px] font-light leading-[36px] text-[#c2b8ff]">
          {quote}
          <span className="text-[#f4f2f0]">. {rest} </span>
          <a href="#features" className="border-b-2 border-dashed border-[rgba(255,255,255,0.6)] text-[rgba(255,255,255,0.6)]">
            Read More
          </a>
        </p>
      </div>
      <div className="flex items-start gap-[16px]">
        <FigmaAsset src={headshot} alt="" width={50} height={50} />
        <div className="flex flex-col gap-[9px]">
          <p className="text-[14px] leading-[24px] text-[#f4f2f0]">{name}</p>
          <FigmaAsset src={logo} alt="" width={logoWidth} height={logoHeight} className="opacity-70" />
        </div>
      </div>
    </div>
  );
}

function DevopsCopy() {
  return (
    <section className="mx-auto mt-20 w-full max-w-[1370px] px-[65px]">
      <div className="flex max-w-[660px] flex-col gap-[20px]">
        <h2 className="text-[51px] font-extralight leading-[60px] tracking-[-1.62px] text-[#f4f2f0]">
          Launch work is never &quot;done.&quot;
        </h2>
        <p className="text-[19px] leading-[29.4px] tracking-[0.21px] text-[#928c97]">
          From managing research, planning, and approvals, to keeping track of budget and
          deadlines, there is always something that needs your attention, taking time away from
          building a successful product.
        </p>
      </div>
      <div className="mt-[52px] overflow-hidden">
        <FigmaAsset src={figma.devopsPain} alt="" width={2121.82} height={333.11} />
      </div>
    </section>
  );
}

function FeatureCards() {
  return (
    <section id="features" className="mx-auto mt-24 flex w-full max-w-[1370px] scroll-mt-24 flex-col gap-[48px] px-[30px]">
      <h2 className="max-w-[982.5px] text-[49px] font-normal leading-[60px] tracking-[-1.62px] text-[#c2b8ff]">
        Your AI product organization is here.
        <span className="text-[#f4f2f0]"> Your team will love using it. You&apos;ll love not building, supporting, or maintaining it.</span>
      </h2>
      <div className="grid gap-[16px] lg:grid-cols-2">
        <FeatureCard
          title="Research and specialist agents"
          body="created with every goal. Collaborate with research, strategy, engineering, and marketing in one run."
          image={figma.featurePrs}
          imageAlt="Pull request and task board"
        />
        <FeatureCard
          title="Live CEO planning"
          body="does the heavy lifting for you. One goal continuously becomes tasks, with live LLM output you can inspect."
          image={figma.featureInfra}
          imageAlt="Infrastructure graph"
        />
        <FeatureCard
          title="Debate and approvals"
          body="offers configurable human gates for risky actions, budget spend, and anything that should not auto-run."
          image={figma.featureCicd}
          imageAlt="CI/CD pipeline"
        />
        <FeatureCard
          title="Social campaign review"
          body="is a click away. Rest assured, publish stays off until you approve, and you control who can ship."
          image={figma.featurePromote}
          imageAlt="Promote workflow"
        />
        <article className="relative overflow-hidden rounded-[10px] bg-[rgba(39,38,45,0.8)] lg:col-span-2">
          <div className="grid items-start gap-8 p-10 lg:grid-cols-2">
            <div className="flex max-w-[615px] flex-col gap-[30px]">
              <h3 className="text-[30px] font-normal leading-[36px] text-[#f4f2f0]">
                One publish path{" "}
                <span className="text-[rgba(146,140,151,0.9)]">
                  lets you review captions, media, and the final report before anything goes live. One click when you are ready.
                </span>
              </h3>
              <a href="#intake" className="text-[18px] font-light leading-[24px] text-[#c2b8ff]">
                Learn more ↗
              </a>
            </div>
            <FigmaAsset src={figma.featureIde} alt="Cloud IDE" className="block w-full" />
          </div>
        </article>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  body,
  image,
  imageAlt,
}: {
  title: string;
  body: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <article className="flex min-h-[616px] flex-col rounded-[10px] bg-[rgba(39,38,45,0.8)] p-10">
      <h3 className="text-[29px] font-normal leading-[36px] text-[#f4f2f0]">
        {title} <span className="text-[rgba(146,140,151,0.9)]">{body}</span>
      </h3>
      <a href="#intake" className="mt-6 text-[18px] font-light leading-[24px] text-[#c2b8ff]">
        Learn more ↗
      </a>
      <div className="mt-auto pt-8">
        <FigmaAsset src={image} alt={imageAlt} className="block w-full" />
      </div>
    </article>
  );
}

function Gantt() {
  return (
    <section className="mx-auto mt-24 flex w-full max-w-[1370px] flex-col gap-[48px] px-[30px]">
      <h2 className="max-w-[982.5px] text-[50px] font-normal leading-[60px] tracking-[-1.62px] text-[#c2b8ff]">
        Don&apos;t build all this stuff yourself.
        <span className="text-[#f4f2f0]"> Rivera gets launch work off your roadmap.</span>
      </h2>
      <FigmaAsset src={figma.gantt} alt="Rivera launch timeline" className="block w-full" />
    </section>
  );
}

function ValueGrid() {
  return (
    <section id="grid" className="mx-auto mt-24 w-full max-w-[1370px] scroll-mt-24 px-[30px]">
      <div className="grid gap-x-[65.5px] gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        <Value
          icon={figma.iconLock}
          title="Secure"
          body="Configure your organization in your own store, using best practices, automatically"
        />
        <Value
          icon={figma.iconSearch}
          title="Compliant"
          body="Get an audit trail of your launch from requirements, to development, to testing & publishing."
        />
        <Value
          icon={figma.iconCode}
          title="Developer-native"
          body="Tasks and decisions are surfaced intuitively, empowering your team regardless of ops experience."
        />
        <Value
          icon={figma.iconOffsite}
          title="Scalable"
          body="Rivera makes sure your agents stay on the goal, and that you are avoiding surprise costs from automation."
        />
        <Value
          icon={figma.iconNoLockin}
          title="No Lock-in"
          body="You can cut off Rivera's access at any time — your product and data remain yours."
        />
        <Value
          icon={figma.iconCost}
          title="Cost-effective"
          body="You get back founder time and keep budget, media, and publish spend under a hard cap."
        />
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
