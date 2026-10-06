// A choice of stringing an edit took away (the owner's IKEA design, session 18): the document names an option the run no
// longer holds, after another module, inverter, voltage or roof changed the options. The engine shows its first option; the
// document is brought to the option shown, so that the screens, the files and the saved design agree, and the user is told
// in plain words. Pure.
import type { DesignOption, DesignResult, Project } from "../api";

type Stringing = { series: number; strings: number; inverters: number };

export type ChoiceGone = {
  /** The stringing of the choice taken away, when its key or the document's own option says it. */
  dropped: Stringing | null;
  /** The option shown in its place: the run's choice, else its first. */
  shown: DesignOption;
};

const CUSTOM = "custom";

function stringingOf(key: string, document: Project): Stringing | null {
  const numbers = key === CUSTOM ? document.custom : key.split("x").map(Number);
  if (!numbers || numbers.length !== 3 || numbers.some((n) => !Number.isInteger(n) || n <= 0)) return null;
  const [series, strings, inverters] = numbers as [number, number, number];
  return { series, strings, inverters };
}

/** The choice the run no longer holds, and the option shown in its place; null when nothing was taken away. */
export function choiceGoneOf(document: Project, design: DesignResult): ChoiceGone | null {
  const key = document.chosen_option;
  if (!key || design.options.length === 0 || design.options.some((option) => option.key === key)) return null;
  const shown = design.options.find((option) => option.key === design.chosen_option) ?? design.options[0]!;
  return { dropped: stringingOf(key, document), shown };
}

/** The document with the option shown as its choice. */
export const withTheChoiceShown =
  ({ shown }: ChoiceGone) =>
  (document: Project): Project => ({ ...document, chosen_option: shown.key });

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const said = ({ series, strings, inverters }: Stringing) =>
  `${series} in series × ${plural(strings, "string", "strings")} on ${plural(inverters, "inverter", "inverters")}`;

/** What the user is told: the stringing chosen, that it no longer fits, and what is used instead. */
export function choiceGoneWords({ dropped, shown }: ChoiceGone): string {
  const chosen = dropped ? `The stringing you chose, ${said(dropped)}, no longer fits this design.` : "The stringing you chose no longer fits this design.";
  const instead = said({ series: shown.n_series, strings: shown.n_strings, inverters: shown.n_inverters });
  const name = `Option ${shown.letter}`;
  const option = shown.caption && shown.caption !== name ? `${name}, ${shown.caption},` : name;
  return `${chosen} ${option} is used instead: ${instead}.`;
}
