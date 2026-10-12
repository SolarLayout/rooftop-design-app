import { describe, expect, test } from "bun:test";
import type { DesignOption, SeriesRange } from "../api";
import { fitProofOf } from "./fit-proof";

// The chosen option says that it fits, and Why opens the proof in plain words (V2 · 6, D102; the board "The Strings step"):
// the lengths that fit at the voltage, then the coldest morning and the hottest afternoon. The Pune demo at 1500 V.

const RANGE = { system_v: 1500, n_min: 14, n_max: 29, voc_cold: 51.0, vmp_hot: 37.8, t_min: 11.9, t_cell_hot: 64.3, limit_v: 1500 } as SeriesRange;
const OPTION = { n_series: 29, verdict: { ok: true, title: "", detail: "…" } } as DesignOption;

describe("the proof that the chosen length fits", () => {
  test("the line that says it fits, and the lengths that fit at the voltage", () => {
    const proof = fitProofOf({ option: OPTION, range: RANGE, mpptMinimum: 500 });

    expect(proof.fits).toEqual({ words: "29 modules a string fits at 1500 V", kind: "fits" });
    expect(proof.heading).toBe("Modules a string can hold at 1500 V");
    expect(proof.atLeast).toBe("14 at least");
    expect(proof.atMost).toBe("29 at most");
  });

  test("the coldest morning and the hottest afternoon, each with its voltage against its limit", () => {
    const { coldest, hottest } = fitProofOf({ option: OPTION, range: RANGE, mpptMinimum: 500 });

    expect(coldest).toEqual({ when: "On the coldest morning, 11.9 °C", result: "A string of 29 reaches 1,479 V, under the 1500 V limit" });
    expect(hottest).toEqual({ when: "On the hottest afternoon, 64.3 °C in the cell", result: "It gives 1,096 V, over the inverter's 500 V minimum" });
  });

  test("a length that misses a limit says over and under the right way round", () => {
    const { coldest, hottest } = fitProofOf({ option: { ...OPTION, n_series: 30 } as DesignOption, range: RANGE, mpptMinimum: 1200 });

    expect(coldest.result).toBe("A string of 30 reaches 1,530 V, over the 1500 V limit");
    expect(hottest.result).toBe("It gives 1,134 V, under the inverter's 1200 V minimum");
  });

  test("an option that does not fit all its marks is not said to fit; the engine's detail stands beside the proof", () => {
    const proof = fitProofOf({ option: { ...OPTION, verdict: { ok: false, title: "", detail: "27 strings on 2 inverters, DC/AC 0.71 (below target)." } } as DesignOption, range: RANGE, mpptMinimum: 500 });

    expect(proof.fits).toEqual({ words: "29 modules a string at 1500 V", kind: "note" });
    expect(proof.detail).toBe("27 strings on 2 inverters, DC/AC 0.71 (below target).");
  });
});
