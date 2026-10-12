// A choice of stringing an edit took away (the owner's IKEA design, session 18): the document names an option the run no
// longer holds, after another module, inverter, voltage or roof changed the options. The engine shows its first option; the
// document is brought to the option shown, so that the screens, the files and the saved design agree, and the user is told
// in one line, with the way to undo the edit that took it away and the way to choose another. Pure.
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

/** What the user is told, in one line (V2 · 5, D77; voice §5): that the stringing no longer fits, and which option is used. */
export function choiceGoneWords({ shown }: ChoiceGone): string {
  return `Your stringing no longer fits. Option ${shown.letter} is used.`;
}
