// The head of each step's work column (V2 · 3, D97): the instruction, and one line under it. The Roof step says what the
// roof was built from and the one value to check first; the others what they hold (the board "The progression").
import type { Roof } from "@/lib/api";
import type { Lens } from "@/lib/routes";

export type StepHead = { title: string; line: string };

const FROM: Record<Roof["source"], string> = { map: "your outline", kmz: "your file", dxf: "your file", coordinates: "your corners" };

export function stepHeadOf(step: Lens, source: Roof["source"]): StepHead {
  switch (step) {
    case "roof":
      return { title: "Check the roof", line: `Built from ${FROM[source]}. The app set the edges: check the parapet, it shades the first row.` };
    case "array":
      return { title: "Choose the module", line: "The module, how it is mounted, how rows are spaced." };
    case "strings":
      return { title: "Check the strings", line: "How the modules are wired to the inverter." };
  }
}
