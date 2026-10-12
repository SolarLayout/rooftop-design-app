// Your own option (the board "Options and your own"; plan/phase-07-plan.md, decisions 8 and 9): its three numbers,
// begun from the chosen option or from the document's own, each bounded by what fits; the edits that add, change
// and remove it; and its card when the engine refused it, in the engine's words. Pure.
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import type { DesignResult, Project } from "../api";

/** Series × strings × inverters. */
export type Custom = [series: number, strings: number, inverters: number];

/** The most inverters the inventory allows (1.5). */
const MOST_INVERTERS = 200;
const LETTERS = "ABCDEFGH";

const whole = (min: number, max: number): Range & { min: number; max: number } => ({ min, max: Math.max(min, max), decimals: 0 });

/** The numbers the fields begin with: the document's own option, else the chosen one's, else the shortest that fits. */
export function customOf(document: Project, design: DesignResult | null): Custom {
  if (document.custom) return [...document.custom] as Custom;
  const chosen = design?.options.find((option) => option.key === design.chosen_option);
  if (chosen) return [chosen.n_series, chosen.n_strings, chosen.n_inverters];
  // Too few positions for an option: the string the API says fits (#171), else the shortest the range allows.
  return [design?.no_options?.fits ?? design?.series_range?.n_min ?? 1, 1, 1];
}

export type CustomBounds = Record<"series" | "strings" | "inverters", { range: Range & { min: number; max: number }; hint: string }>;

/** What each field may take, for the numbers as they stand: the strings follow the series, the inverters the strings. */
export function customBoundsOf(design: DesignResult, [series, strings, inverters]: Custom): CustomBounds {
  const { n_min: low, n_max: high } = design.series_range ?? { n_min: series, n_max: series };
  const held = design.strings_by_series.find((one) => one.n_series === series)?.strings ?? 0;
  return {
    series: { range: whole(low, high), hint: `${low} to ${high} fit` },
    strings:
      held === 0
        ? { range: whole(1, 1), hint: `No string of ${series} fits on the roof` }
        : { range: whole(Math.min(inverters, held), held), hint: `${Math.min(inverters, held)} to ${shown(held, 0)} of ${series} fit` },
    inverters: { range: whole(1, Math.min(MOST_INVERTERS, strings)), hint: `1 to ${shown(Math.min(MOST_INVERTERS, strings), 0)}` },
  };
}

/** The document with its own option added or changed, and chosen: the user asked for it. */
export function withCustom(document: Project, custom: Custom): Project {
  return { ...document, custom, chosen_option: "custom" };
}

/** The document without its own option; when that was chosen, the run's first is chosen again. */
export function withoutCustom(document: Project): Project {
  return { ...document, custom: null, chosen_option: document.chosen_option === "custom" ? "" : document.chosen_option };
}

export type RefusedCard = { letter: string; numbers: string; title: string; detail: string };

/** The card of your own option when the engine did not simulate it, in its words; null when it did or there is none. */
export function refusedCardOf(document: Project, design: DesignResult | null): RefusedCard | null {
  const refused = design?.custom_refused;
  if (!document.custom || !refused) return null;
  const [series, strings, inverters] = document.custom;
  return {
    letter: LETTERS[design.options.length] ?? "",
    numbers: `${shown(series, 0)} × ${shown(strings, 0)} · ${inverters} ${inverters === 1 ? "inverter" : "inverters"}`,
    title: refused.title,
    detail: refused.detail,
  };
}

/** The target of DC/AC the engine states in its note on the options: the ends of the range. */
const TARGET = /Target DC\/AC (\d\.\d\d)–(\d\.\d\d)/;

/** What the numbers of your own option come to before Add: the power, the DC/AC ratio, and whether the ratio is in the engine's target. */
export function customVerdictOf(design: DesignResult, [series, strings, inverters]: Custom): { kind: "fits" | "note"; words: string } {
  const dc = (series * strings * design.equipment.module.pnom_w) / 1000;
  const ratio = dc / (inverters * design.equipment.inverter.pnom_kw);
  const figures = `${shown(dc, 2)} kWp · DC/AC ratio ${shown(ratio, 2)}`;
  const target = TARGET.exec(design.options_note ?? "");
  if (!target) return { kind: "fits", words: figures };
  if (ratio < Number(target[1])) return { kind: "note", words: `Under the DC/AC target · ${figures}` };
  if (ratio > Number(target[2])) return { kind: "note", words: `Over the DC/AC target · ${figures}` };
  return { kind: "fits", words: `Fits · ${figures}` };
}
