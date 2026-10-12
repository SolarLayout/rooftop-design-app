// Find's first step (V2 · 4, D98; before it D85): the search first in the column, the examples of what it reads in its
// list while it is empty, and the two other ways under it. Pure; the column draws it.

/** A way to start under the search: the device's location, or the roof by its measurements. */
export type Way = "locate" | "hand";

/** An example of what the search reads: what it is, what goes into the search, what the list shows of it. */
export type Example = { what: string; text: string; shown: string };

// One place, Koregaon Park in Pune, written each way the search reads it (lib/places/place-input.ts).
export const EXAMPLES: readonly Example[] = [
  { what: "An address", text: "Koregaon Park, Pune", shown: "Koregaon Park, Pune" },
  { what: "Coordinates", text: "18.53621, 73.89380", shown: "18.53621, 73.89380" },
  { what: "A maps link", text: "https://www.google.com/maps/@18.53621,73.89380,19z", shown: "google.com/maps/@18.53621,73.89380" },
];

export const WAYS: readonly { way: Way; title: string; words: string }[] = [
  { way: "locate", title: "Use my location", words: "When you are at the building" },
  { way: "hand", title: "Enter the roof by hand", words: "Type its length and width" },
];

/** How the roof is entered: drawn on the map, or typed by its measurements. */
export type Entry = "map" | "hand";

/** Where a place found leads: to the outline on the map, or without a map to the entry by hand at that place. */
export const entryAfterPlace = (hasMap: boolean): Entry => (hasMap ? "map" : "hand");
