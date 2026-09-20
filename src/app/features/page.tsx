import type { Metadata } from "next";
import { Features } from "@/components/site/features";

export const metadata: Metadata = {
  title: "Features | Rivera",
  description: "One goal. A full product org. Rivera staffs research, planning, and production.",
};

export default function FeaturesPage() {
  return <Features />;
}
