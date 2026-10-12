import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Studio } from "@/components/studio/Studio";
import { SunOfBefore } from "@/components/studio/SunOfBefore";
import { isLens, LENSES, type Lens } from "@/lib/routes";

type Props = { params: Promise<{ lens: string }> };

const nameOf = (lens: Lens) => LENSES.find((one) => one.id === lens)?.name ?? "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lens } = await params;
  return isLens(lens) ? { title: `${nameOf(lens)} · SolarLayout Rooftop` } : {};
}

export default async function LensPage({ params }: Props) {
  const { lens } = await params;
  // Sun is a view of every step now (D95): its old address turns the view on over the step in hand.
  if (lens === "sun") return <SunOfBefore />;
  if (!isLens(lens)) notFound();

  return <Studio lens={lens} />;
}
