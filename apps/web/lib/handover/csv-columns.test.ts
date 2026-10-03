import { describe, expect, test } from "bun:test";
import { csvColumnsOf } from "./csv-columns";

// The meaning of each column of the hourly CSV, in the words of the board "Handover, previews" (plan/phase-09-plan.md,
// decision 8), given for the header the file has.

const HEADER = ["time_utc_hour_start", "ghi_w_m2", "poa_eff_w_m2", "t_cell_c", "p_dc_kw", "p_ac_kw"];

describe("the six columns of the engine's CSV", () => {
  test("each named as the file names it, with the board's words", () => {
    expect(csvColumnsOf(HEADER).map((row) => [row.name, row.words])).toEqual([
      ["time_utc_hour_start", "The hour's start, UTC"],
      ["ghi_w_m2", "Global horizontal irradiance, W/m²"],
      ["poa_eff_w_m2", "Effective irradiance in the plane of the modules, W/m²"],
      ["t_cell_c", "Cell temperature, °C"],
      ["p_dc_kw", "DC power into the inverter, kW"],
      ["p_ac_kw", "AC power to the grid, kW"],
    ]);
  });

  test("the rows follow the file's header: a column the words do not know is named and said to be the file's", () => {
    expect(csvColumnsOf(["p_ac_kw", "wind_m_s"]).map((row) => [row.name, row.words])).toEqual([
      ["p_ac_kw", "AC power to the grid, kW"],
      ["wind_m_s", "A column of the file, not described here"],
    ]);
  });
});
