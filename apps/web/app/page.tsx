import type { Metadata } from "next";
import { Home } from "@/components/home/Home";

export const metadata: Metadata = { title: "SolarLayout Rooftop" };

// Home (plan/phase-10-plan.md, step 11): outside the shell of the workspaces, with the stores of the app around it.
export default function HomePage() {
  return <Home />;
}
