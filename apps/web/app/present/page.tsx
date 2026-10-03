import type { Metadata } from "next";
import { Present } from "@/components/present/Present";

export const metadata: Metadata = { title: "Present · SolarLayout Rooftop" };

// Present is a page of its own, without the shell's chrome, inside the stores' provider of the root layout
// (plan/phase-10-plan.md, decision 8): the design that is open is the one the tour shows.
export default function PresentPage() {
  return <Present />;
}
