import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitPartTwo } from "@/components/kit/KitPartTwo";

export const metadata: Metadata = { title: "Kit · SolarLayout Rooftop" };

// The components of round 4 and the bottom sheet. Not a part of the product: outside development the
// page does not exist.
export default function KitPartTwoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitPartTwo />;
}
