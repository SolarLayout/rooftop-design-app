import type { Metadata } from "next";
import { Handover } from "@/components/handover/Handover";

export const metadata: Metadata = { title: "Handover · SolarLayout Rooftop" };

/** The list of Handover; on desktop and tablet with the first item's preview beside it (plan/phase-09-plan.md, decision 3). */
export default function HandoverPage() {
  return <Handover item={null} />;
}
