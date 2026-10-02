import { describe, expect, test } from "bun:test";
import type { DesignOption, DesignResult } from "../api";
import { figuresOf } from "./sun-figures";

// The figures of shading over the year (plan/phase-06-plan.md, decision 13): the chosen option's, as its
// loss chain has them; before an option, of all the positions, the electrical figure waiting.
const steps = [
  { label: "Far shading, horizon", value: 0, kind: "irr", pct: -0.011 },
  { label: "Near shading, linear", value: 0, kind: "irr", pct: -0.3546 },
  { label: "Electrical shading", value: 0, kind: "energy", pct: -0.5641 },
];
const OPTION_A = { key: "29x22x1", letter: "A", n_modules: 638, energy: { steps } } as unknown as DesignOption;
const SHADING = { near_pct: 0.369, far_pct: 0.0109, near_pct_by_module: [], keepout_area_m2: 149.98 };
const withOption = { shading: SHADING, options: [OPTION_A], chosen_option: "29x22x1", no_options: null, far_shading_note: "Far shading: PVGIS horizon, highest 2.7°", layout: { modules: new Array(790) } } as unknown as DesignResult;
const withoutOption = {
  ...withOption,
  options: [],
  chosen_option: null,
  no_options: { code: "system_voltage_missing", title: "Choose a system voltage to size the strings", message: "600, 1000 or 1500 V. Nothing is sized until you choose." },
} as unknown as DesignResult;

describe("the shading figures", () => {
  test("with an option they are its loss chain's, of its modules", () => {
    expect(figuresOf(withOption, 149.98)).toEqual({
      near: { value: "0.35", waits: null },
      electrical: { value: "0.56", waits: null },
      far: { value: "0.01", waits: null },
      keptClear: "150",
      of: "Of the 638 modules of option A",
      horizon: "Far shading: PVGIS horizon, highest 2.7°",
    });
  });

  test("without an option they are of all the positions, and the electrical one waits in the API's words", () => {
    expect(figuresOf(withoutOption, 149.98)).toEqual({
      near: { value: "0.37", waits: null },
      electrical: { value: null, waits: "Choose a system voltage to size the strings" },
      far: { value: "0.01", waits: null },
      keptClear: "150",
      of: "Of all 790 positions",
      horizon: "Far shading: PVGIS horizon, highest 2.7°",
    });
  });

  test("before any run there is nothing but the kept clear area of the layout", () => {
    expect(figuresOf(null, 149.98)).toEqual({
      near: { value: null, waits: null },
      electrical: { value: null, waits: null },
      far: { value: null, waits: null },
      keptClear: "150",
      of: null,
      horizon: null,
    });
  });

  test("before any layout there is no kept clear area either", () => {
    expect(figuresOf(null, null).keptClear).toBeNull();
  });
});
