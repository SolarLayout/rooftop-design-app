// What the Strings lens's inspector shows (the boards "Studio, Strings lens", "Options and your own" and "System voltage ·
// Set by the user's country"; plan/phase-07-plan.md, decisions 4 and 5; D87): the series range, the verdict, and why
// there are no options when there are none, in the API's words. Pure; the inspector draws what it gives.
import type { DesignOption, DesignResult, SeriesRange } from "../api";
import type { Verdict } from "../api";

import type { Volts } from "./voltages";

/** A design without a voltage: the app gives every design one (D87), so it is one from elsewhere. Only the choice is shown. */
export type NoVoltage = { kind: "no-voltage" };

export type Sized = {
  kind: "sized";
  voltage: Volts;
  /** The range of the run; null before a run sized the strings. */
  range: SeriesRange | null;
  /** The range is of the voltage chosen; not while the run for a voltage chosen since is on its way, or failed. */
  isOfTheVoltage: boolean;
  /** The length of the chosen option, for the marker; null when there is no option. */
  chosen: number | null;
  /** The verdict under the bar: the chosen option's, or why no length fits; null without either. */
  verdict: Verdict | null;
  /** When nothing fits or nothing is offered: the API's words and what can change it. */
  noOptions: { title: string; message: string; change: string | null } | null;
};

export type StringsView = NoVoltage | Sized;

/** What can change a design where no length fits (the board "Options and your own"). */
export const CHANGE_WHEN_NOTHING_FITS = "Change the system voltage, the inverter or the sizing temperatures";

type Of = {
  /** The voltage of the document, or none (a design the app did not make). */
  voltage: number | null;
  design: DesignResult | null;
  /** The option shown as chosen. */
  option: DesignOption | null;
};

export function stringsViewOf({ voltage, design, option }: Of): StringsView {
  if (voltage === null) return { kind: "no-voltage" };
  const volts = voltage as Volts;
  // The range of before stays while the run of another voltage is on its way, as every value of before does (step 21).
  const range = design?.series_range ?? null;
  if (!range || !design) return { kind: "sized", voltage: volts, range: null, isOfTheVoltage: false, chosen: null, verdict: null, noOptions: null };
  const isOfTheVoltage = range.system_v === voltage;
  const reason = design.no_options;
  if (reason && reason.code !== "system_voltage_missing") {
    const change = reason.code === "no_string_length_fits" ? CHANGE_WHEN_NOTHING_FITS : null;
    const verdict = reason.code === "no_string_length_fits" ? { ok: false, title: reason.title, detail: reason.message } : null;
    return { kind: "sized", voltage: volts, range, isOfTheVoltage, chosen: null, verdict, noOptions: { title: reason.title, message: reason.message, change } };
  }
  return { kind: "sized", voltage: volts, range, isOfTheVoltage, chosen: option?.n_series ?? null, verdict: option?.verdict ?? null, noOptions: null };
}
