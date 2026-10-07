// Find's first step (D85; the boards "UI fixes · Find's first step"): what the panel says and offers before a place is found.

/** A way to start: the search, the device's location, or the roof by its measurements. */
export type Way = "search" | "locate" | "hand";

/** An example of what the search understands: what it is, what goes into the search, what the panel shows of it. */
export type Example = { what: string; text: string; shown: string };

export type FirstStep = {
  lead: string;
  /** The ways to start, in their order, each with its title and what it is for. */
  ways: readonly { way: Way; title: string; words: string }[];
  /** Whether the examples of the search are shown: without a map nothing can be flown to. */
  examples: boolean;
  steps: readonly { name: string; words: string }[];
};

// One place, Koregaon Park in Pune, written each way the search reads it (lib/places/place-input.ts).
export const EXAMPLES: readonly Example[] = [
  { what: "Address", text: "Koregaon Park, Pune", shown: "Koregaon Park, Pune" },
  { what: "Coordinates", text: "18.53621, 73.89380", shown: "18.53621, 73.89380" },
  { what: "Degrees", text: "18°32′10.4″N 73°53′37.7″E", shown: "18°32′10.4″N 73°53′37.7″E" },
  { what: "Maps link", text: "https://www.google.com/maps/@18.53621,73.89380,19z", shown: "google.com/maps/@18.53621,73.89380" },
];

const SEARCH = { way: "search", title: "Search for the building", words: "An address, coordinates or a maps link" } as const;
const LOCATE = { way: "locate", title: "Use my location", words: "When you are at the building" } as const;
const BY_HAND = "Enter dimensions by hand";

const WITH_A_MAP: FirstStep = {
  lead: "Find the building first: the map flies to it, close enough to outline its roof.",
  ways: [SEARCH, LOCATE, { way: "hand", title: BY_HAND, words: "The roof is measured already" }],
  examples: true,
  steps: [
    { name: "Find", words: "the map flies to the building" },
    { name: "Outline", words: "trace the roof, then what stands on it" },
    { name: "Build", words: "the Studio opens, the array on the roof" },
  ],
};

const WITHOUT_A_MAP: FirstStep = {
  lead: "The map cannot be shown here. The roof can still be entered by its measurements, at a place you search or type.",
  ways: [{ way: "hand", title: BY_HAND, words: "Its place, then its length, width and facing" }],
  examples: false,
  steps: [
    { name: "Find", words: "the place, searched or typed" },
    { name: "Outline", words: "the roof's measurements, typed" },
    { name: "Build", words: "the Studio opens, the array on the roof" },
  ],
};

/** The first step's panel, with a map or without one. */
export const firstStepOf = (hasMap: boolean): FirstStep => (hasMap ? WITH_A_MAP : WITHOUT_A_MAP);

/** How the roof is entered: drawn on the map, or typed by its measurements. */
export type Entry = "map" | "hand";

/** Where a place found leads (D85): to the outline on the map, or without a map to the entry by hand at that place. */
export const entryAfterPlace = (hasMap: boolean): Entry => (hasMap ? "map" : "hand");
