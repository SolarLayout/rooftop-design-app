import type { Metadata } from "next";
import { Performance } from "@/components/performance/Performance";

export const metadata: Metadata = { title: "Performance · SolarLayout Rooftop" };

export default function PerformancePage() {
  return <Performance />;
}
