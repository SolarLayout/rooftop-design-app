// The option cards of the Strings lens (docs/design/components.md, "Option card"; the boards "Studio, Strings
// lens" and "Options and your own"): each option of the run as the engine answers it, its caption the engine's
// (plan/phase-07-plan.md, decision 11), the chosen one as the run's answer holds it. Pure.
import { shown } from "../../components/ui/number-entry";
import { wordsOfTheTarget } from "../../components/shell/notes-view";
import type { DesignOption, DesignResult } from "../api";

export type OptionCard = {
  key: string;
  letter: string;
  /** Why the option is there, in two or three words (the vocabulary: Recommended, Less clipping, Below target). */
  caption: string;
  /** "29 × 22 · 357.28 kWp", and " · 2 inverters" when more than one: series × strings · power. */
  facts: string;
  /** Year 1, in MWh. */
  energy: string;
  /** A tick or a note, with its words: never a cross. */
  mark: { kind: "fits" | "note"; label: string };
  isChosen: boolean;
  isCustom: boolean;
  /** How the option misses the DC/AC target, if it does: the cards that miss it fold under one line. */
  miss: "below" | "above" | "other" | null;
};

const plural = (count: number, one: string, many: string) => `${shown(count, 0)} ${count === 1 ? one : many}`;

/** The run's captions in the vocabulary of the app (plan/v2/voice.md §6): "Lower clipping" is Less clipping, "Your own" is Your own option. */
const CAPTION_WORDS: Readonly<Record<string, string>> = { "Lower clipping": "Less clipping", "Your own": "Your own option" };

/** A caption of the run as the app says it: on the option cards and in Performance's Option. */
export const captionWordsOf = (caption: string): string => CAPTION_WORDS[caption] ?? caption;

/** The card's caption: a miss of the target loses its inverters, which the facts say. */
function captionOf(option: DesignOption): string {
  if (option.caption === "") return `Option ${option.letter}`;
  return option.ok ? captionWordsOf(option.caption) : option.caption.replace(/, \d+ inverters?$/, "");
}

/** An option in target whose verdict does not fit: its MPPT loading does not (plan/phase-07-plan.md, decision 18). */
const OVER_AN_MPPT = "MPPT current over its limit, or the limit not known";

export function optionCardsOf(design: DesignResult | null): OptionCard[] {
  if (!design) return [];
  return design.options.map((option) => ({
    key: option.key,
    letter: option.letter,
    caption: captionOf(option),
    facts: `${shown(option.n_series, 0)} × ${shown(option.n_strings, 0)} · ${shown(option.dc_kwp, 2)} kWp${option.n_inverters > 1 ? ` · ${plural(option.n_inverters, "inverter", "inverters")}` : ""}`,
    energy: shown(option.energy.energy_mwh, 1),
    mark: !option.ok
      ? { kind: "note", label: wordsOfTheTarget(option) }
      : option.verdict.ok
        ? { kind: "fits", label: wordsOfTheTarget(option) }
        : { kind: "note", label: OVER_AN_MPPT },
    isChosen: option.key === design.chosen_option,
    isCustom: option.custom,
    miss: option.ok ? null : option.note.startsWith("below") ? "below" : option.note.startsWith("above") ? "above" : "other",
  }));
}

/** The line the options below the target fold under: how many, and why; none where none are. */
export function foldedWordsOf(cards: readonly OptionCard[]): string | null {
  if (cards.length === 0) return null;
  const misses = new Set(cards.map((card) => card.miss));
  const how = misses.size === 1 && misses.has("below") ? "below" : misses.size === 1 && misses.has("above") ? "above" : "outside";
  return `${cards.length} more, ${how} the DC/AC target`;
}
