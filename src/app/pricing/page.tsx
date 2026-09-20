import type { Metadata } from "next";
import { Pricing } from "@/components/site/pricing";

export const metadata: Metadata = {
  title: "Pricing | Rivera",
  description: "Start in a sandbox. Pay when the launch is real.",
};

export default function PricingPage() {
  return <Pricing />;
}
