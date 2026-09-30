import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitShell } from "@/components/kit/KitShell";

export const metadata: Metadata = { title: "Kit · SolarLayout Rooftop" };

// The parts of the shell in every state. Not a part of the product: outside development the page does
// not exist.
export default function KitShellPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitShell />;
}
