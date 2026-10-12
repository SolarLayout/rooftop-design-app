// Home as a start screen (V2 · 9, D105; the board "V2 · 9 · Handover and Home"; audit V2-03, V2-05, V2-09, V2-14, V2-115):
// one title at the title's size, one line of what the app does, the search the largest thing with Find the roof beside it,
// the other ways in as links under it; the designs on this device first when there are any, under the search, which stays
// at the top as the page scrolls; the demo after, its line and Open the demo, no figures. Pure: the components draw it.
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

export const DEMO = {
  title: "Try the demo",
  line: "A finished design on a 90 × 40 m roof in Pune, to look around before you start your own.",
  action: "Open the demo",
} as const;

export type HomeSection = "designs" | "demo";

/** What stands under the search, in order: the designs on this device first when there are any, the demo after. */
export const sectionsOf = (designs: number): HomeSection[] => (designs > 0 ? ["designs", "demo"] : ["demo"]);

/** The head of the designs: its title, and how many there are. */
export const designsHeadOf = (count: number) => ({ title: "Your designs · on this device", count: `${shown(count, 0)} ${count === 1 ? "design" : "designs"}` });
