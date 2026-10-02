// What the Strings lens's inspector shows (the boards "Studio, Strings lens", "Studio, Strings lens, no system
// voltage yet" and "Options and your own"; plan/phase-07-plan.md, decisions 1, 4 and 5): before a voltage the
// decision and what waits for it; after, the series range, the verdict, and why there are no options when
// there are none, in the API's words. Pure; the inspector draws what it gives.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, DesignResult, LayoutReadouts, SeriesRange } from "../api";
import type { Verdict } from "../api";

export type Volts = 600 | 1000 | 1500;
export const VOLTAGES: readonly Volts[] = [600, 1000, 1500];

/** What waits for the choice of a voltage (the board "Studio, Strings lens, no system voltage yet"). */
export const WAITING = ["Modules in series", "Stringing options and the recommendation", "Energy, PR and yield", "Single-line diagram, BOM and exports"] as const;

export type BeforeAVoltage = {
  kind: "before-a-voltage";
  /** Which ratings set the limit, from the equipment the run read; null before a run. */
  limitLine: string | null;
  waiting: readonly string[];
  /** What the run did already; empty before a run. */
  done: string[];
};

export type Sized = {
  kind: "sized";
  voltage: Volts;
  /** The range of the run, when the run is of the voltage chosen; null while the run for it is on its way. */
  range: SeriesRange | null;
  /** The length of the chosen option, for the marker; null when there is no option. */
  chosen: number | null;
  /** The verdict under the bar: the chosen option's, or why no length fits; null without either. */
  verdict: Verdict | null;
  /** When nothing fits or nothing is offered: the API's words and what can change it. */
  noOptions: { title: string; message: string; change: string | null } | null;
};

export type StringsView = BeforeAVoltage | Sized;

const ratingsLineOf = (design: DesignResult): string | null => {
  const ofTheModule = design.equipment.module.v_max_iec;
  const ofTheInverter = design.equipment.inverter.vabs_max;
  // Volts as the engine writes a limit ("Limit 1500 V"): whole, without a separator.
  const rating = (volts: number) => `${Math.round(volts)} V`;
  if (ofTheModule > 0 && ofTheInverter > 0) return `The module is rated ${rating(ofTheModule)} and the inverter ${rating(ofTheInverter)}. The lowest of the three sets the limit.`;
  if (ofTheInverter > 0) return `The inverter is rated ${rating(ofTheInverter)}; the module's file gives no rating. The lower of the two sets the limit.`;
  if (ofTheModule > 0) return `The module is rated ${rating(ofTheModule)}; the inverter's file gives no rating. The lower of the two sets the limit.`;
  return "Neither file gives a rating: the system voltage is the limit.";
};

const doneOf = (design: DesignResult, readouts: LayoutReadouts | null): string[] => [
  `Layout: ${shown((readouts ?? design.readouts).positions, 0)} positions`,
  `Weather: ${design.weather.label}, ${shown(design.weather.hours, 0)} hours`,
  "Shading for every module",
];

/** What can change a design where no length fits (the board "Options and your own"). */
export const CHANGE_WHEN_NOTHING_FITS = "Change the system voltage, the inverter or the sizing temperatures";

type Of = {
  /** The voltage of the document: the user's, or none. */
  voltage: number | null;
  design: DesignResult | null;
  readouts: LayoutReadouts | null;
  /** The option shown as chosen. */
  option: DesignOption | null;
};

export function stringsViewOf({ voltage, design, readouts, option }: Of): StringsView {
  if (voltage === null) {
    return { kind: "before-a-voltage", limitLine: design ? ratingsLineOf(design) : null, waiting: WAITING, done: design ? doneOf(design, readouts) : [] };
  }
  const volts = voltage as Volts;
  const range = design?.series_range && design.series_range.system_v === voltage ? design.series_range : null;
  if (!range || !design) return { kind: "sized", voltage: volts, range: null, chosen: null, verdict: null, noOptions: null };
  const reason = design.no_options;
  if (reason && reason.code !== "system_voltage_missing") {
    const change = reason.code === "no_string_length_fits" ? CHANGE_WHEN_NOTHING_FITS : null;
    const verdict = reason.code === "no_string_length_fits" ? { ok: false, title: reason.title, detail: reason.message } : null;
    return { kind: "sized", voltage: volts, range, chosen: null, verdict, noOptions: { title: reason.title, message: reason.message, change } };
  }
  return { kind: "sized", voltage: volts, range, chosen: option?.n_series ?? null, verdict: option?.verdict ?? null, noOptions: null };
}
