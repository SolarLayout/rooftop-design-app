import type { Metadata } from "next";
import { NotBuiltYet } from "@/components/shell/NotBuiltYet";

export const metadata: Metadata = { title: "Performance · SolarLayout Rooftop" };

export default function PerformancePage() {
  return (
    <main className="flex flex-col gap-2 px-page-x-phone py-page-y tablet:px-page-x-tablet desktop:px-page-x-desktop">
      <h1 className="type-page">Performance</h1>
      <NotBuiltYet />
    </main>
  );
}
