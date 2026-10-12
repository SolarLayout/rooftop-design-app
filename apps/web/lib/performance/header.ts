// The selects beside Performance's lead (V2 · 8, D104; plan/phase-08-plan.md, decision 4): the items of Option, and the
// engine's notes on the weather. Made of the run's answer; the web counts, it does not judge. The weather select reads
// the document (weather-source.ts). Pure.
import type { Mark } from "../../components/ui/table-cells";
import type { DesignResult } from "../api";
import { captionWordsOf, optionCardsOf } from "../studio/option-cards";

export type OptionItem = {
  key: string;
  letter: string;
  /** What sets the option apart, in the engine's words: "Recommended", "Your own"; may be empty. */
  caption: string;
  /** The letter; the chosen one with its caption: "A · Recommended". */
  label: string;
  /** What the item is called to a screen reader: the label with the mark's words. */
  name: string;
  /** A tick or a note, as the option cards of the Strings lens derive it: never a cross. */
  mark: Mark;
  isChosen: boolean;
};

export type HeaderView = {
  /** The engine's notes on the weather, in its words, in the Weather assumption: a CSV without beam and diffuse, without temperature, without wind. */
  notes: string[];
  /** The run's options; empty before there are any. A refused custom is not among them: it has no energy. */
  items: OptionItem[];
  /** The key of the chosen option; null before options. */
  chosen: string | null;
};

const lowerFirst = (words: string) => words.charAt(0).toLowerCase() + words.slice(1);

/** An option in the select: its letter and caption; on phone the chosen one's letter alone (V2 · 8). */
export const optionWordsOf = (item: Pick<OptionItem, "letter" | "caption">, isPhone: boolean): string => (isPhone || item.caption === "" ? item.letter : `${item.letter} · ${item.caption}`);

/** The header from the run. */
export function headerOf(design: DesignResult): HeaderView {
  const option = design.options.find((one) => one.key === design.chosen_option) ?? null;
  const items = optionCardsOf(design).map((card, index): OptionItem => {
    const caption = captionWordsOf(design.options[index]!.caption);
    const label = card.isChosen && caption !== "" ? `${card.letter} · ${caption}` : card.letter;
    return { key: card.key, letter: card.letter, caption, label, name: `${label}, ${lowerFirst(card.mark.label)}`, mark: card.mark, isChosen: card.isChosen };
  });
  return {
    notes: design.weather_notes,
    items,
    chosen: option?.key ?? null,
  };
}
