import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Studio } from "@/components/studio/Studio";
import { isLens, LENSES, type Lens } from "@/lib/routes";

type Props = { params: Promise<{ lens: string }> };

const nameOf = (lens: Lens) => LENSES.find((one) => one.id === lens)?.name ?? "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lens } = await params;
  return isLens(lens) ? { title: `${nameOf(lens)} · Studio · SolarLayout Rooftop` } : {};
}

export default async function LensPage({ params }: Props) {
  const { lens } = await params;
  if (!isLens(lens)) notFound();

  return <Studio lens={lens} />;
}
