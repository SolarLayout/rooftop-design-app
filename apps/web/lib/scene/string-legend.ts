// The legend of the strings on the stage (plan/phase-07-plan.md, step 14; the boards "Strings on the roof" and
// "Studio, Strings lens" on three sizes): what each colour marks, by string, by MPPT or by inverter, then the
// positions not used. Pure: the swatch is the number of a series colour, which the component draws with its token;
// the words are never in a series colour.
import { categoryOf, numberOfString, seriesOf, type Colouring, type Wired } from "./string-colours";

/** A series colour by its number, from 1 to 6, or the grey of the positions not used. */
export type Swatch = number | "unused";

export type LegendEntry = { swatch: Swatch; words: string };

export type StringLegend = {
  /** Every colour and what it marks, in the order of the series; "Not used" last while positions are not used. */
  entries: LegendEntry[];
  /** The legend where room is short (tablet, phone): a lead word ("MPPT", "INV") and the numbers, or the strings as they are. */
  compact: { lead: string | null; items: LegendEntry[] };
  /** The line beside the switch by string, which says how the colours go; null by MPPT and by inverter. */
  note: string | null;
  /** The legend in words, to a screen reader. */
  label: string;
};

const COUNTED = ["no", "one", "two", "three", "four", "five", "six"];

const LEAD: Record<Exclude<Colouring, "string">, { lead: string; words: (category: number) => string }> = {
  mppt: { lead: "MPPT", words: (category) => `MPPT ${category}` },
  inverter: { lead: "INV", words: (category) => `INV-${category}` },
};

/** The legend of the strings coloured by *colouring*, with *unused* positions not used by the option. */
export function stringLegendOf(strings: readonly Wired[], colouring: Colouring, unused: number): StringLegend {
  const unusedEntry: LegendEntry[] = unused > 0 ? [{ swatch: "unused", words: "Not used" }] : [];
  if (colouring === "string") {
    const numbers = strings.map((string) => numberOfString(string.label)).sort((a, b) => a - b);
    const series = [...new Set(numbers.map(seriesOf))].sort((a, b) => a - b);
    const colours = series.map((swatch) => ({ swatch, words: numbers.filter((number) => seriesOf(number) === swatch).map((number) => `S${number}`).join(" · ") }));
    const entries = [...colours, ...unusedEntry];
    return { entries, compact: { lead: null, items: colours }, note: `By string: ${COUNTED[colours.length]} colours in turn along the rows`, label: labelOf(entries) };
  }
  const { lead, words } = LEAD[colouring];
  const categories = [...new Set(strings.map((string) => categoryOf(string, colouring)))].sort((a, b) => a - b);
  const entries = [...categories.map((category) => ({ swatch: seriesOf(category), words: words(category) })), ...unusedEntry];
  return { entries, compact: { lead, items: categories.map((category) => ({ swatch: seriesOf(category), words: String(category) })) }, note: null, label: labelOf(entries) };
}

const labelOf = (entries: readonly LegendEntry[]) => `Colours: ${entries.map((entry) => entry.words).join(", ")}`;
