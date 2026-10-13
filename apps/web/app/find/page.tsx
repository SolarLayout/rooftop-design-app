import type { Metadata } from "next";
import { Suspense } from "react";
import { Find } from "@/components/find/Find";

export const metadata: Metadata = { title: "Find the roof · SolarLayout Rooftop" };

// Outside the shell of the workspaces: the map is the whole screen, and the design is what is built here.
export default function FindPage() {
  // The screen reads its address (?at=, ?place=, ?by=hand): what reads the address renders on the client, inside a boundary.
  return (
    <Suspense>
      <Find />
    </Suspense>
  );
}
