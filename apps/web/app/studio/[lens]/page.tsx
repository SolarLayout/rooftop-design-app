import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotBuiltYet } from "@/components/shell/NotBuiltYet";
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

  return (
    <main className="flex flex-col gap-2 px-page-x-phone py-page-y tablet:px-page-x-tablet desktop:px-page-x-desktop">
      <h1 className="type-lens-touch tablet:type-lens">{nameOf(lens)}</h1>
      <NotBuiltYet />
    </main>
  );
}
