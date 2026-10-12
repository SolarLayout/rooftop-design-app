// The app's own words, each explained in one line where the user first meets it (D96; plan/v2/voice.md §12; the board
// "V2 · 2", "The app's own words, explained"). One place: a step's tooltip, the line under a page's title on first
// meeting, the "Next:" line under a primary, the ? after.

export const EXPLAIN = {
  Roof: "The roof's outline, its edges and what stands on it",
  Array: "The modules on the roof, how they are mounted and spaced",
  Strings: "How the modules are wired to the inverter",
  Performance: "The energy the design makes in a year, and where it is lost",
  Handover: "The files for the client, the installer and the utility",
  Sun: "Shadows at any hour, and the shade on each module over the year",
  Options: "Ways to wire the modules to the inverter, the best first",
  "Your own option": "Your own number of modules per string and strings",
  "To review": "Values outside the usual range. Each one says how to fix it",
  "Project file": "The whole design in one file, to open again in the app",
  "Design day": "The day the rows are spaced for, so they do not shade each other",
  Present: "The design as a tour on the whole screen, for a client",
} as const;

export type ExplainedWord = keyof typeof EXPLAIN;

/** The word's line as a sentence. */
export const lineOf = (word: ExplainedWord) => `${EXPLAIN[word]}.`;

/** The line under a step's primary until the next step has been opened once: "Next: Strings, how the modules …". */
export function nextLineOf(word: ExplainedWord): string {
  const line = EXPLAIN[word];
  return `Next: ${word}, ${line[0].toLowerCase()}${line.slice(1)}.`;
}
