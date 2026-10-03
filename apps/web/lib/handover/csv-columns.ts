// The meaning of each column of the hourly CSV (plan/phase-09-plan.md, decision 8), in the words of the board "Handover,
// previews", for the header the file has. Pure.
import type { FactRow } from "./earth-view";

/** The six columns the engine writes (export_csv_bytes: the index named time_utc_hour_start, then the hourly frame's). */
const WORDS: Readonly<Record<string, string>> = {
  time_utc_hour_start: "The hour's start, UTC",
  ghi_w_m2: "Global horizontal irradiance, W/m²",
  poa_eff_w_m2: "Effective irradiance in the plane of the modules, W/m²",
  t_cell_c: "Cell temperature, °C",
  p_dc_kw: "DC power into the inverter, kW",
  p_ac_kw: "AC power to the grid, kW",
};
const NOT_DESCRIBED = "A column of the file, not described here";

/** A row per column of the header, in the file's order, with what the column is. */
export const csvColumnsOf = (header: readonly string[]): FactRow[] => header.map((name) => ({ name, words: WORDS[name] ?? NOT_DESCRIBED }));
