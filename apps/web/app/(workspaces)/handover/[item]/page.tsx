import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Handover } from "@/components/handover/Handover";
import { HANDOVER_ITEMS, isHandoverItem, type HandoverItem } from "@/lib/routes";

type Props = { params: Promise<{ item: string }> };

const nameOf = (item: HandoverItem) => HANDOVER_ITEMS.find((one) => one.id === item)?.name ?? "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item } = await params;
  return isHandoverItem(item) ? { title: `${nameOf(item)} · Handover · SolarLayout Rooftop` } : {};
}

/** One item of Handover: beside the list on desktop and tablet, pushed over it on phone (plan/phase-09-plan.md, decision 3). */
export default async function HandoverItemPage({ params }: Props) {
  const { item } = await params;
  if (!isHandoverItem(item)) notFound();

  return <Handover item={item} />;
}
