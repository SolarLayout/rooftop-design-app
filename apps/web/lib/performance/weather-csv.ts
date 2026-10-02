// The CSV dialog (plan/phase-08-plan.md, step 19, decisions 12 and 19; the board "Weather and assumptions"): its words,
// and the summary of the file the API read, in three lines. The notes are the API's, shown as they come. Pure.
import { shown } from "../../components/ui/number-entry";
import type { WeatherSummary } from "../api";

export const CSV_WORDS = {
  title: "Load weather from a CSV",
  sentence: "Hourly values of a year: a time column, global irradiance, and, if you have them, beam, diffuse, air temperature and wind. Times are read as UTC.",
  drop: "Drop the weather file here",
  detail: "A CSV of hourly values",
  whenOver: "It is read, and becomes the weather of this design when you use it",
  accept: ".csv,.CSV,.txt",
  use: "Use this weather",
} as const;

/** The file's summary as its card shows it: the hours and the GHI, beam and diffuse, the lowest and the highest temperature. */
export function csvSummaryLinesOf(summary: WeatherSummary): [string, string, string] {
  return [
    `${shown(summary.hours, 0)} hours · GHI ${shown(summary.ghi_kwh_m2, 1)} kWh/m²`,
    `beam ${shown(summary.dni_kwh_m2, 1)} · diffuse ${shown(summary.dhi_kwh_m2, 1)} kWh/m²`,
    `${shown(summary.t_min_c, 1)} to ${shown(summary.t_max_c, 1)} °C`,
  ];
}
