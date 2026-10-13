import { describe, expect, test } from "bun:test";
import type { CurrentPerMppt, DesignResult, Inverter, InverterResponse, Project } from "../api";
import { inverterCardOf, inverterFactsOf, inverterShownOf, withInverterRead } from "./inverter-card";

const WATTPOWER = { manufacturer: "WattPower Systems Pvt.Ltd", model: "WP-330KTL-H1", pnom_kw: 275, n_mppt: 6, n_inputs: 28, source: "wattpower-wp-330ktl-h1.OND" } as Inverter;
const OF_THE_FILE: CurrentPerMppt = { value_a: 65, source: "IMaxDC over the MPPT count", note: "Not in the OND: IMaxDC 390 A ÷ 6 MPPT. Enter the datasheet value if it differs." };

describe("the inverter card (the board \"Studio, Strings lens\"; plan/phase-07-plan.md, decision 15)", () => {
  test("the model, the maker as people know it (D75) with the power and the MPPTs, the current per MPPT and the inputs", () => {
    expect(inverterCardOf(WATTPOWER, OF_THE_FILE, null)).toEqual({
      name: "WP-330KTL-H1",
      line: "WattPower · 275 kW · 6 MPPT",
      facts: "65.0 A per MPPT · 28 inputs",
      isCurrentKnown: true,
      file: "wattpower-wp-330ktl-h1.OND",
    });
  });

  test("a current entered is the one that counts, and says so", () => {
    expect(inverterCardOf(WATTPOWER, OF_THE_FILE, 60).facts).toBe("60.0 A per MPPT, entered · 28 inputs");
  });

  test("a file without a current per MPPT says it is not in the OND", () => {
    const none: CurrentPerMppt = { value_a: null, source: "not in the OND", note: "…" };
    expect(inverterCardOf({ ...WATTPOWER, n_inputs: 5 }, none, null)).toMatchObject({ facts: "Current per MPPT not in the inverter file · 5 inputs", isCurrentKnown: false });
    expect(inverterCardOf({ ...WATTPOWER, n_inputs: 5 }, none, 30)).toMatchObject({ facts: "30.0 A per MPPT, entered · 5 inputs", isCurrentKnown: true });
  });

  test("one input is one input; a power with decimals keeps them", () => {
    expect(inverterCardOf({ ...WATTPOWER, n_inputs: 1, pnom_kw: 3.68, n_mppt: 1 }, OF_THE_FILE, null)).toMatchObject({ line: "WattPower · 3.68 kW · 1 MPPT", facts: "65.0 A per MPPT · 1 input" });
  });
});

const SUNGROW = { ...WATTPOWER, manufacturer: "Sungrow", model: "SG3300UD-20", pnom_kw: 3300, n_mppt: 3, n_inputs: 5, source: "sungrow-sg3300ud-20.OND" } as Inverter;
const NOT_IN_THE_OND: CurrentPerMppt = { value_a: null, source: "not in the OND", note: "Not in the OND, and the OND has no IMaxDC to work it out from. Enter the datasheet value." };

describe("which inverter the card shows (plan/phase-07-plan.md, step 17; as the module's, moduleShownOf)", () => {
  const design = { equipment: { inverter: WATTPOWER, max_current_per_mppt: OF_THE_FILE } } as unknown as DesignResult;
  const replaced = { inverter: SUNGROW, current: NOT_IN_THE_OND, edit: 5 };

  test("nothing before a design ran or a file was read", () => {
    expect(inverterShownOf({ design: null, designEdit: null, replaced: null })).toBeNull();
  });

  test("the design's inverter with the current per MPPT of its file", () => {
    expect(inverterShownOf({ design, designEdit: 3, replaced: null })).toEqual({ inverter: WATTPOWER, current: OF_THE_FILE });
  });

  test("the inverter read from a replaced file, until the run of that edit lands", () => {
    expect(inverterShownOf({ design, designEdit: 3, replaced })).toEqual({ inverter: SUNGROW, current: NOT_IN_THE_OND });
    expect(inverterShownOf({ design: null, designEdit: null, replaced })).toEqual({ inverter: SUNGROW, current: NOT_IN_THE_OND });
    expect(inverterShownOf({ design, designEdit: 5, replaced })?.inverter).toBe(WATTPOWER);
    expect(inverterShownOf({ design, designEdit: 6, replaced })?.inverter).toBe(WATTPOWER);
  });

  test("the card of the file read: the names as the file states them, the current not in the OND, the file", () => {
    expect(inverterCardOf(SUNGROW, NOT_IN_THE_OND, null)).toEqual({
      name: "SG3300UD-20",
      line: "Sungrow · 3,300 kW · 3 MPPT",
      facts: "Current per MPPT not in the inverter file · 5 inputs",
      isCurrentKnown: false,
      file: "sungrow-sg3300ud-20.OND",
    });
  });
});

describe("the edit of a file read (inventory 1.4: a new OND clears the current entered)", () => {
  const read: InverterResponse = { file: "sungrow-sg3300ud-20.OND", inverter: SUNGROW, max_current_per_mppt: NOT_IN_THE_OND, text: "PVObject_=pvGInverter" };

  test("commits the file's text and its name, the user's from now on (D118), and clears the current per MPPT entered", () => {
    const document = { name: "Pune demo roof", ond_text: "", ond_path: "", inverter_by: "app", imax_mppt_override: 60, ac_cable_m: 30 } as unknown as Project;
    expect(withInverterRead(document, read)).toEqual({ ...document, ond_text: "PVObject_=pvGInverter", ond_path: "sungrow-sg3300ud-20.OND", inverter_by: "user", imax_mppt_override: null });
    expect(document.imax_mppt_override).toBe(60);
  });
});

describe("the inverter's facts on one line (V2 · 3)", () => {
  test("the model and its power", () => {
    expect(inverterFactsOf(WATTPOWER)).toBe("WP-330KTL-H1 · 275 kW · 6 MPPT");
    expect(inverterFactsOf({ ...WATTPOWER, pnom_kw: 3.68 })).toBe("WP-330KTL-H1 · 3.68 kW · 6 MPPT");
  });
});
