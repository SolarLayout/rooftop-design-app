import type { Metadata } from "next";
import { Find } from "@/components/find/Find";

export const metadata: Metadata = { title: "Find and outline · SolarLayout Rooftop" };

// Outside the shell of the workspaces: the map is the whole screen, and the design is what is built here.
export default function FindPage() {
  return <Find />;
}
