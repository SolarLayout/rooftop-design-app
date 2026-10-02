// The option cards of the Strings lens (docs/design/components.md, "Option card"; the boards "Studio, Strings
// lens" and "Options and your own"): each option of the run as the engine answers it, its caption the engine's
// (plan/phase-07-plan.md, decision 11), the chosen one as the run's answer holds it. Pure.
import { shown } from "../../components/ui/number-entry";
import { wordsOfTheTarget } from "../../components/shell/notes-view";
import type { DesignResult } from "../api";

export type OptionCard = {
  key: string;
  letter: string;
  caption: string;
  /** "29 × 22 · 357.28 · 1.30": series × strings · kWp · DC/AC. */
  numbers: string;
  /** Year 1, in MWh. */
  energy: string;
  /** A tick or a note, with its words: never a cross. */
  mark: { kind: "fits" | "note"; label: string };
  isChosen: boolean;
  isCustom: boolean;
};

/** An option in target whose verdict does not fit: its MPPT loading does not (plan/phase-07-plan.md, decision 18). */
const OVER_AN_MPPT = "Over the current of an MPPT, or its limit not known: see the MPPT loading";

export function optionCardsOf(design: DesignResult | null): OptionCard[] {
  if (!design) return [];
  return design.options.map((option) => ({
    key: option.key,
    letter: option.letter,
    caption: option.caption === "" ? `Option ${option.letter}` : option.caption,
    numbers: `${shown(option.n_series, 0)} × ${shown(option.n_strings, 0)} · ${shown(option.dc_kwp, 2)} · ${shown(option.dcac, 2)}`,
    energy: shown(option.energy.energy_mwh, 1),
    mark: !option.ok
      ? { kind: "note", label: wordsOfTheTarget(option) }
      : option.verdict.ok
        ? { kind: "fits", label: wordsOfTheTarget(option) }
        : { kind: "note", label: OVER_AN_MPPT },
    isChosen: option.key === design.chosen_option,
    isCustom: option.custom,
  }));
}
