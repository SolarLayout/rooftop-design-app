import { describe, expect, test } from "bun:test";
import type { CurrentPerMppt, Inverter } from "../api";
import { inverterCardOf } from "./inverter-card";

const WATTPOWER = { manufacturer: "WattPower Systems Pvt.Ltd", model: "WP-330KTL-H1", pnom_kw: 275, n_mppt: 6, n_inputs: 28 } as Inverter;
const OF_THE_FILE: CurrentPerMppt = { value_a: 65, source: "IMaxDC over the MPPT count", note: "Not in the OND: IMaxDC 390 A ÷ 6 MPPT. Enter the datasheet value if it differs." };

describe("the inverter card (the board \"Studio, Strings lens\"; plan/phase-07-plan.md, decision 15)", () => {
  test("the model, the maker as the file states it with the power and the MPPTs, the current per MPPT and the inputs", () => {
    expect(inverterCardOf(WATTPOWER, OF_THE_FILE, null)).toEqual({
      name: "WP-330KTL-H1",
      line: "WattPower Systems Pvt.Ltd · 275 kW · 6 MPPT",
      facts: "65.0 A per MPPT · 28 inputs",
    });
  });

  test("a current entered is the one that counts, and says so", () => {
    expect(inverterCardOf(WATTPOWER, OF_THE_FILE, 60).facts).toBe("60.0 A per MPPT, entered · 28 inputs");
  });

  test("a file without a current per MPPT says it is not in the OND", () => {
    const none: CurrentPerMppt = { value_a: null, source: "not in the OND", note: "…" };
    expect(inverterCardOf({ ...WATTPOWER, n_inputs: 5 }, none, null).facts).toBe("Current per MPPT not in the OND · 5 inputs");
  });

  test("one input is one input; a power with decimals keeps them", () => {
    expect(inverterCardOf({ ...WATTPOWER, n_inputs: 1, pnom_kw: 3.68, n_mppt: 1 }, OF_THE_FILE, null)).toMatchObject({ line: "WattPower Systems Pvt.Ltd · 3.68 kW · 1 MPPT", facts: "65.0 A per MPPT · 1 input" });
  });
});
