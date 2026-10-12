// The legend of the strings on the stage (plan/phase-07-plan.md, step 14; the boards "Strings on the roof",
// "Studio, Strings lens" and "UI fixes · The strings' legend with many MPPT" on three sizes): what each colour marks,
// by string, by MPPT or by inverter, then the positions not used. Pure: the swatch is the number of a series colour, which the component draws with its token;
// the words are never in a series colour.
import { categoryOf, numberOfString, seriesOf, type Colouring, type Wired } from "../stores/string-colours";

/** A series colour by its number, from 1 to 6, or the grey of the positions not used. */
export type Swatch = number | "unused";

export type LegendEntry = { swatch: Swatch; words: string };

export type StringLegend = {
  /** Every colour and what it marks, in the order of the series; "Not used" last while positions are not used. */
  entries: LegendEntry[];
  /** The legend where room is short (tablet, phone): a lead word ("MPPT", "INV") and the numbers close (1·7), or the strings as the entries name them. */
  compact: { lead: string | null; items: LegendEntry[] };
  /** The line beside the switch by string, which says how the colours go; null by MPPT and by inverter. */
  note: string | null;
  /** The legend in words, to a screen reader. */
  label: string;
};

/** By MPPT and by inverter: the lead word of the compact legend, and the words before a colour's numbers. */
const LEAD: Record<Exclude<Colouring, "string">, { lead: string; prefix: string }> = {
  mppt: { lead: "MPPT", prefix: "MPPT " },
  inverter: { lead: "INV", prefix: "INV-" },
};

/** Past this many in one colour, the entry names the first three, an ellipsis and the last (D92). */
const NAMED_IN_FULL = 4;

/** The numbers of each series colour there is, in the order of the series: the seventh comes round to the first's. */
function byColour(numbers: readonly number[]): { swatch: number; numbers: number[] }[] {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const swatches = [...new Set(sorted.map(seriesOf))].sort((a, b) => a - b);
  return swatches.map((swatch) => ({ swatch, numbers: sorted.filter((number) => seriesOf(number) === swatch) }));
}

/** What one colour marks, joined: past four, the first three, an ellipsis and the last. */
function shortened(named: readonly string[], joiner: string): string {
  if (named.length <= NAMED_IN_FULL) return named.join(joiner);
  return `${named.slice(0, NAMED_IN_FULL - 1).join(joiner)} … ${named[named.length - 1]}`;
}

/**
 * The legend of the strings coloured by *colouring*, with *unused* positions not used by the option: one entry per
 * series colour, naming every string, MPPT or inverter it marks (D92), so that it never has more than six and Not used.
 */
export function stringLegendOf(strings: readonly Wired[], colouring: Colouring, unused: number): StringLegend {
  const unusedEntry: LegendEntry[] = unused > 0 ? [{ swatch: "unused", words: "Not used" }] : [];
  const labelOf = (inFull: readonly string[]) => `Colours: ${[...inFull, ...unusedEntry.map((entry) => entry.words)].join(", ")}`;
  if (colouring === "string") {
    const colours = byColour(strings.map((string) => numberOfString(string.label))).map(({ swatch, numbers }) => ({ swatch, named: numbers.map((number) => `S${number}`) }));
    const items = colours.map(({ swatch, named }) => ({ swatch, words: shortened(named, " · ") }));
    return {
      entries: [...items, ...unusedEntry],
      compact: { lead: null, items },
      note: `By string: ${colours.length} ${colours.length === 1 ? "colour" : "colours"} in turn along the rows`,
      label: labelOf(colours.map(({ named }) => named.join(" · "))),
    };
  }
  const { lead, prefix } = LEAD[colouring];
  const colours = byColour(strings.map((string) => categoryOf(string, colouring))).map(({ swatch, numbers }) => ({ swatch, named: numbers.map(String) }));
  return {
    entries: [...colours.map(({ swatch, named }) => ({ swatch, words: `${prefix}${shortened(named, " · ")}` })), ...unusedEntry],
    compact: { lead, items: colours.map(({ swatch, named }) => ({ swatch, words: shortened(named, "·") })) },
    note: null,
    label: labelOf(colours.map(({ named }) => `${prefix}${named.join(" · ")}`)),
  };
}
