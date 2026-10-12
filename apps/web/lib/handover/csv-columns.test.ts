import { describe, expect, test } from "bun:test";
import { csvColumnsOf } from "./csv-columns";

// The meaning of each column of the hourly CSV, in the words of the board "Handover, previews" (plan/phase-09-plan.md,
// decision 8), given for the header the file has.

const HEADER = ["time_utc_hour_start", "ghi_w_m2", "poa_eff_w_m2", "t_cell_c", "p_dc_kw", "p_ac_kw"];

describe("the six columns of the hourly data (V2 · 9, audit V2-94)", () => {
  test("each by its plain name and its unit, the file's own name under it", () => {
    expect(csvColumnsOf(HEADER)).toEqual([
      { file: "time_utc_hour_start", name: "Hour", under: "UTC · time_utc_hour_start" },
      { file: "ghi_w_m2", name: "Sunlight on the ground", under: "W/m² · ghi_w_m2" },
      { file: "poa_eff_w_m2", name: "Sunlight on the modules", under: "W/m² · poa_eff_w_m2" },
      { file: "t_cell_c", name: "Cell temperature", under: "°C · t_cell_c" },
      { file: "p_dc_kw", name: "DC power", under: "kW · p_dc_kw" },
      { file: "p_ac_kw", name: "AC power", under: "kW · p_ac_kw" },
    ]);
  });

  test("the columns follow the file's header: one the app does not know is named as the file names it", () => {
    expect(csvColumnsOf(["p_ac_kw", "wind_m_s"])).toEqual([
      { file: "p_ac_kw", name: "AC power", under: "kW · p_ac_kw" },
      { file: "wind_m_s", name: "wind_m_s", under: "" },
    ]);
  });
});
