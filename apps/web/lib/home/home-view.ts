// Home (D120: direction A, Golden hour, of the canvas "Rooftop Home · Three directions", with direction B's Your designs and
// its graph paper): the title and the app's line over the demo's picture, the search the largest thing with Find the roof in
// it, the other ways in as chips under it; the demo's card on the picture; Your designs a table, the demo its first row.
// Pure: the components draw it.
import { shown } from "../../components/ui/number-entry";

export const HOME = {
  title: "Rooftop PV design",
  line: "Outline a roof on the map. The app lays out the modules, the shade, the strings and the energy of a year.",
  placeholder: "Address or coordinates",
  find: "Find the roof",
} as const;

export type WayIn = "locate" | "hand" | "import" | "open";

export const WAYS_IN: ReadonlyArray<{ id: WayIn; words: string }> = [
  { id: "locate", words: "Use my location" },
  { id: "hand", words: "Enter the roof by hand" },
  { id: "import", words: "Import a drawing" },
  { id: "open", words: "Open a project file" },
];

/** The demo's row, first in Your designs, and its card on the picture (D120). Its figures are the bundled demo's run: the
 * engine's test of the demo (apps/api/tests/engine/test_demo_equipment.py) holds them to the engine's. */
export const DEMO = {
  name: "Pune demo roof",
  badge: "Demo",
  place: "Pune · 90 × 40 m",
  kwp: "348.00",
  mwh: "586.4",
  action: "Open the demo",
  /** The same on phone and tablet, where the row has less room. */
  open: "Open",
} as const;

/** The demo's picture, the roof as Present shows it: the hero's (wide on desktop, tall on phone and tablet) and the demo row's. */
export const DEMO_PICTURE = "/home/demo-roof-wide.jpg";
export const DEMO_PICTURE_TALL = "/home/demo-roof-tall.jpg";

/** The columns of Your designs on desktop (direction B's table), after the plan of each design. */
export const DESIGN_COLUMNS = ["Design", "Place", "kWp", "MWh per year", "Edited"] as const;

/** The head of Your designs: its title, and how many designs this device keeps; no count before there is one. */
export const designsHeadOf = (count: number) => ({ title: "Your designs · on this device", count: count === 0 ? null : `${shown(count, 0)} ${count === 1 ? "design" : "designs"}` });
