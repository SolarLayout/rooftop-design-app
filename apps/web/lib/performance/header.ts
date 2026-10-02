// The header of Performance (the board "Performance" on three sizes; plan/phase-08-plan.md, decisions 2 and 4):
// the line of the run under the title and the items of the option switch. Made of the run's answer, in the
// board's words; the web counts, it does not judge. The weather select reads the document (weather-source.ts). Pure.
import { shown } from "../../components/ui/number-entry";
import type { Mark } from "../../components/ui/table-cells";
import type { DesignOption, DesignResult, LayoutReadouts, WeatherSummary } from "../api";
import { optionCardsOf } from "../studio/option-cards";

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
  runLine: string;
  /** The engine's notes on the weather, in its words, under the line: a CSV without beam and diffuse, without temperature, without wind. */
  notes: string[];
  /** The run's options; empty before there are any. A refused custom is not among them: it has no energy. */
  items: OptionItem[];
  /** The key of the chosen option; null before options. */
  chosen: string | null;
};

/** The source named in the line of the run, short, so that the line fits beside the controls at 1440. */
const SOURCE_NAME: Record<WeatherSummary["source"], string> = { pvgis: "PVGIS", nasa: "NASA POWER", csv: "CSV" };

function stringingOf({ n_series, n_strings, n_inverters }: DesignOption): string {
  const inverters = n_inverters === 1 ? "1 inverter" : `${shown(n_inverters, 0)} inverters`;
  return `${shown(n_series, 0)} modules in series × ${shown(n_strings, 0)} strings on ${inverters}`;
}

function weatherOf(weather: WeatherSummary): string {
  const horizon = weather.horizon_highest_deg === null ? "no horizon" : `horizon up to ${shown(weather.horizon_highest_deg, 1)}°`;
  return `${shown(weather.hours, 0)} hours of ${SOURCE_NAME[weather.source]} weather, ${shown(weather.t_min_c, 1)} to ${shown(weather.t_max_c, 1)} °C, ${horizon}`;
}

const lowerFirst = (words: string) => words.charAt(0).toLowerCase() + words.slice(1);

/** The header from the run; `readouts` are the newer of the layout's and the run's, null when only the run has them. */
export function headerOf(design: DesignResult, readouts: LayoutReadouts | null): HeaderView {
  const option = design.options.find((one) => one.key === design.chosen_option) ?? null;
  const first = option ? stringingOf(option) : `${shown((readouts ?? design.readouts).positions, 0)} positions ready`;
  const items = optionCardsOf(design).map((card, index): OptionItem => {
    const caption = design.options[index]!.caption;
    const label = card.isChosen && caption !== "" ? `${card.letter} · ${caption}` : card.letter;
    return { key: card.key, letter: card.letter, caption, label, name: `${label}, ${lowerFirst(card.mark.label)}`, mark: card.mark, isChosen: card.isChosen };
  });
  return {
    runLine: `${first} · ${weatherOf(design.weather)}`,
    notes: design.weather_notes,
    items,
    chosen: option?.key ?? null,
  };
}
