import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Kit } from "@/components/kit/Kit";

export const metadata: Metadata = { title: "Kit · SolarLayout Rooftop" };

// Every component in every state, to look at and to take the screenshots of. Not a part of the product:
// outside development the page does not exist.
export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Kit />;
}
