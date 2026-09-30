import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotBuiltYet } from "@/components/shell/NotBuiltYet";
import { HANDOVER_ITEMS, isHandoverItem, type HandoverItem } from "@/lib/routes";

type Props = { params: Promise<{ item: string }> };

const nameOf = (item: HandoverItem) => HANDOVER_ITEMS.find((one) => one.id === item)?.name ?? "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item } = await params;
  return isHandoverItem(item) ? { title: `${nameOf(item)} · Handover · SolarLayout Rooftop` } : {};
}

export default async function HandoverItemPage({ params }: Props) {
  const { item } = await params;
  if (!isHandoverItem(item)) notFound();

  return (
    <main className="flex flex-col gap-2 px-page-x-phone py-page-y tablet:px-page-x-tablet desktop:px-page-x-desktop">
      <h1 className="type-page">Handover</h1>
      <h2 className="type-title">{nameOf(item)}</h2>
      <NotBuiltYet />
    </main>
  );
}
