import { describe, expect, test } from "bun:test";
import type { InverterEntry, ModuleEntry } from "./catalog";
import { inverterRowOf, kwShown, moduleRowOf, ratedUnderOf } from "./rows";

const HELIENE: ModuleEntry = {
  file: "Heliene_144HC-540-M10-SL-Bifacial_TUV-SUD.PAN", sha256: "", maker: "Heliene Inc", model: "144HC-540 M10 SL Bifacial", data_source: "TUV SUD",
  wp: 540, efficiency_pct: 20.89, length_m: 2.279, width_m: 1.134, bifaciality: 0.7,
};
const SOLIS: InverterEntry = {
  file: "Solis_S5-GC125K-HV.OND", sha256: "", maker: "Ginlong Technologies", model: "S5-GC125K-HV", data_source: "",
  ac_kw: 125, mppt: 10, vmpp_min_v: 180, vmpp_max_v: 1000, vdc_max_v: 1100, preliminary: false,
};

describe("a module's row", () => {
  test("the model, the maker as people know it, and the numbers of the columns", () => {
    expect(moduleRowOf(HELIENE, new Set())).toEqual({
      model: "144HC-540 M10 SL Bifacial",
      second: "Heliene",
      cells: { wp: "540", efficiency: "20.9", size: "2.28 × 1.13", bifacial: "0.70" },
      phone: "540 Wp · 20.9 % · 2.28 × 1.13 m",
      preliminary: false,
    });
  });

  test("a model that comes in two files adds the file's data source", () => {
    expect(moduleRowOf(HELIENE, new Set([HELIENE.model])).second).toBe("Heliene · TUV SUD");
  });

  test("a module of one face has a dash for its bifaciality", () => {
    expect(moduleRowOf({ ...HELIENE, bifaciality: null }, new Set()).cells.bifacial).toBe("–");
  });
});

describe("an inverter's row", () => {
  test("the model, the maker as people know it, and the numbers of the columns", () => {
    expect(inverterRowOf(SOLIS)).toEqual({
      model: "S5-GC125K-HV",
      second: "Solis",
      cells: { kw: "125", mppt: "10", window: "180–1,000", vdc: "1,100" },
      phone: "125 kW · 10 MPPT · 180–1,000 V",
      preliminary: false,
    });
  });

  test("a power under 1 kW keeps its decimal, and a preliminary file says so", () => {
    expect(kwShown(0.7)).toBe("0.7");
    expect(kwShown(3.68)).toBe("3.68");
    expect(kwShown(350)).toBe("350");
    expect(inverterRowOf({ ...SOLIS, preliminary: true }).preliminary).toBe(true);
  });
});

describe("an inverter rated under the system voltage set (the boards \"System voltage · Set by the user's country\")", () => {
  test("says so under its maker", () => {
    expect(ratedUnderOf(800, 1000)).toBe("Up to 800 V: strings sized under the 1000 V set");
  });

  test("says nothing when it takes the voltage, when its file gives no rating, or before a voltage", () => {
    expect(ratedUnderOf(1000, 1000)).toBeNull();
    expect(ratedUnderOf(1500, 1000)).toBeNull();
    expect(ratedUnderOf(0, 1000)).toBeNull();
    expect(ratedUnderOf(800, null)).toBeNull();
  });
});
