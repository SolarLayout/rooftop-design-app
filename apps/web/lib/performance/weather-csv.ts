// The CSV dialog (plan/phase-08-plan.md, step 19, decisions 12 and 19; the board "Weather and assumptions"): its words,
// and the summary of the file the API read, in three lines. The notes are the API's, shown as they come. Pure.
import { shown } from "../../components/ui/number-entry";
import type { WeatherSummary } from "../api";

export const CSV_WORDS = {
  title: "Load weather from a CSV",
  sentence: "Hourly values of a year: a time column, global irradiance, and, if you have them, beam, diffuse, air temperature and wind. Times are read as UTC.",
  drop: "Drop the weather file here",
  detail: "A CSV of hourly values, 3 MB at most",
  whenOver: "It is read, and becomes the weather of this design when you use it",
  accept: ".csv,.CSV,.txt",
  use: "Use this weather",
} as const;

/**
 * The largest CSV the API takes (MAX_CSV_TEXT, #162): more than a year of weather takes (hourly, 0.5 to 0.75 MB; every
 * 15 minutes, 2 to 3 MB), and small enough that a project carrying it is always run and opened again.
 */
export const MAX_CSV_BYTES = 3_000_000;

/** The dialog's own words for a file over MAX_CSV_BYTES: no request is made for it. */
export const CSV_TOO_LARGE = "This file is over 3 MB, more than a year of weather takes. Choose a file of hourly values.";

/** Whether the file is small enough to send: its size in bytes, which is at least its count of characters. */
export function csvFits(file: Pick<File, "size">): boolean {
  return file.size <= MAX_CSV_BYTES;
}

/** The file's summary as its card shows it: the hours and the GHI, beam and diffuse, the lowest and the highest temperature. */
export function csvSummaryLinesOf(summary: WeatherSummary): [string, string, string] {
  return [
    `${shown(summary.hours, 0)} hours · GHI ${shown(summary.ghi_kwh_m2, 1)} kWh/m²`,
    `beam ${shown(summary.dni_kwh_m2, 1)} · diffuse ${shown(summary.dhi_kwh_m2, 1)} kWh/m²`,
    `${shown(summary.t_min_c, 1)} to ${shown(summary.t_max_c, 1)} °C`,
  ];
}
