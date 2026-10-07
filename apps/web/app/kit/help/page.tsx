import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpProbe } from "@/components/kit/HelpProbe";

export const metadata: Metadata = { title: "Kit, help · SolarLayout Rooftop" };

// The help's bodies as the sheet draws them, every topic of the manifest in turn. Not a part of the product: outside
// development the page does not exist.
export default function KitHelpPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <HelpProbe />;
}
