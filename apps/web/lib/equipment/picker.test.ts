import { describe, expect, test } from "bun:test";
import type { InverterEntry, ModuleEntry } from "./catalog";
import {
  countWords,
  FILTER,
  filterWordsOf,
  pickerLineOf,
  filteredInverters,
  filteredModules,
  INVERTER_COLUMNS,
  INVERTER_START,
  kwSpanOf,
  kwStopsOf,
  matchesSearch,
  MODULE_COLUMNS,
  MODULE_START,
  nextPickerSort,
  orderOptions,
  powerScaleOf,
  sortedEntries,
  twinModels,
  voltageStopsOf,
} from "./picker";

const aModule = (file: string, wp: number, more: Partial<ModuleEntry> = {}): ModuleEntry => ({
  file, sha256: "", maker: "Heliene Inc", model: file.replace(".PAN", ""), data_source: "", wp, efficiency_pct: 20, length_m: 2, width_m: 1, bifaciality: null, ...more,
});
const inverter = (file: string, ac_kw: number, mppt: number, more: Partial<InverterEntry> = {}): InverterEntry => ({
  file, sha256: "", maker: "Ginlong Technologies", model: file.replace(".OND", ""), data_source: "", ac_kw, mppt, vmpp_min_v: 180, vmpp_max_v: 1000, vdc_max_v: 1100, preliminary: false, ...more,
});

describe("the search", () => {
  test("every word typed is found in the maker, as the file states it or as people know it, the model or the file's name", () => {
    const entry = inverter("Solis_S5-GC125K-HV.OND", 125, 10);
    expect(matchesSearch(entry, "")).toBe(true);
    expect(matchesSearch(entry, "solis")).toBe(true);
    expect(matchesSearch(entry, "GINLONG gc125")).toBe(true);
    expect(matchesSearch(entry, "solis_s5")).toBe(true);
    expect(matchesSearch(entry, "huawei")).toBe(false);
    expect(matchesSearch(entry, "solis huawei")).toBe(false);
  });
});

describe("the modules' filters", () => {
  const modules = [aModule("A.PAN", 305), aModule("B.PAN", 560), aModule("C.PAN", 645)];

  test("the power's scale runs from the library's lowest to its highest, in fifties, in steps of 5", () => {
    expect(powerScaleOf(modules)).toEqual({ min: 300, max: 650, step: 5 });
    expect(powerScaleOf([])).toEqual({ min: 0, max: 50, step: 5 });
  });

  test("a module is listed when its power is within the span and the search finds it", () => {
    expect(filteredModules(modules, { search: "", wp: [300, 650] }).map((m) => m.file)).toEqual(["A.PAN", "B.PAN", "C.PAN"]);
    expect(filteredModules(modules, { search: "", wp: [540, 580] }).map((m) => m.file)).toEqual(["B.PAN"]);
    expect(filteredModules(modules, { search: "c.pan", wp: [300, 650] }).map((m) => m.file)).toEqual(["C.PAN"]);
  });
});

describe("the inverters' filters", () => {
  const inverters = [inverter("A.OND", 0.7, 1), inverter("B.OND", 60, 6), inverter("C.OND", 125, 10), inverter("D.OND", 350, 15)];

  test("the AC power goes by steps closer at the low end, from the library's lowest to its highest", () => {
    expect(kwStopsOf(inverters)).toEqual([0.7, 1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 350]);
    expect(kwStopsOf([inverter("A.OND", 4, 1), inverter("B.OND", 12, 2)])).toEqual([4, 5, 8, 10, 12]);
  });

  test("the maximum DC voltage goes by the voltages the library holds", () => {
    expect(voltageStopsOf([inverter("A.OND", 5, 1, { vdc_max_v: 600 }), inverter("B.OND", 5, 1, { vdc_max_v: 1500 }), inverter("C.OND", 5, 1, { vdc_max_v: 600 })])).toEqual([600, 1500]);
    expect(voltageStopsOf([])).toEqual([0, 1]);
  });

  test("an inverter is listed when its maximum DC voltage is within its span", () => {
    const mixed = [inverter("A.OND", 60, 6, { vdc_max_v: 600 }), inverter("B.OND", 60, 6, { vdc_max_v: 1100 }), inverter("C.OND", 60, 6, { vdc_max_v: 1500 })];
    const stops = kwStopsOf(mixed);
    const volts = voltageStopsOf(mixed);
    const all = { search: "", kw: [0, stops.length - 1] as const, mppt: [1, 15] as const, vdc: [0, volts.length - 1] as const };
    expect(filteredInverters(mixed, all, stops, volts)).toHaveLength(3);
    expect(filteredInverters(mixed, { ...all, vdc: [1, 2] }, stops, volts).map((i) => i.file)).toEqual(["B.OND", "C.OND"]);
  });

  test("an inverter is listed when its AC power and its MPPT are within their spans", () => {
    const stops = kwStopsOf(inverters);
    const volts = voltageStopsOf(inverters);
    const all = { search: "", kw: [0, stops.length - 1] as const, mppt: [1, 15] as const, vdc: [0, volts.length - 1] as const };
    expect(filteredInverters(inverters, all, stops, volts)).toHaveLength(4);
    const fifty = stops.indexOf(50);
    const hundredTwentyFive = stops.indexOf(125);
    expect(filteredInverters(inverters, { ...all, kw: [fifty, hundredTwentyFive] }, stops, volts).map((i) => i.file)).toEqual(["B.OND", "C.OND"]);
    expect(filteredInverters(inverters, { ...all, kw: [fifty, hundredTwentyFive], mppt: [8, 15] }, stops, volts).map((i) => i.file)).toEqual(["C.OND"]);
  });
});

describe("the sorting", () => {
  const modules = [aModule("A.PAN", 560, { efficiency_pct: 21 }), aModule("B.PAN", 540, { efficiency_pct: 22.5 }), aModule("C.PAN", 580, { efficiency_pct: 21, bifaciality: 0.8 })];

  test("the list opens sorted by power, upwards", () => {
    expect(MODULE_START).toEqual({ key: "wp", direction: "ascending" });
    expect(INVERTER_START).toEqual({ key: "ac_kw", direction: "ascending" });
    expect(sortedEntries(modules, MODULE_COLUMNS, MODULE_START).map((m) => m.file)).toEqual(["B.PAN", "A.PAN", "C.PAN"]);
  });

  test("a first press sorts the figures downwards and the names A to Z, a second turns it, a third gives the power back", () => {
    const first = nextPickerSort(MODULE_START, "efficiency_pct", MODULE_COLUMNS, MODULE_START);
    expect(first).toEqual({ key: "efficiency_pct", direction: "descending" });
    const second = nextPickerSort(first, "efficiency_pct", MODULE_COLUMNS, MODULE_START);
    expect(second).toEqual({ key: "efficiency_pct", direction: "ascending" });
    expect(nextPickerSort(second, "efficiency_pct", MODULE_COLUMNS, MODULE_START)).toEqual(MODULE_START);
    expect(nextPickerSort(MODULE_START, "model", MODULE_COLUMNS, MODULE_START)).toEqual({ key: "model", direction: "ascending" });
  });

  test("a press on the power turns it, and again gives it back", () => {
    const turned = nextPickerSort(MODULE_START, "wp", MODULE_COLUMNS, MODULE_START);
    expect(turned).toEqual({ key: "wp", direction: "descending" });
    expect(nextPickerSort(turned, "wp", MODULE_COLUMNS, MODULE_START)).toEqual(MODULE_START);
  });

  test("rows that are equal keep the library's order; a module of one face sorts as bifaciality 0", () => {
    expect(sortedEntries(modules, MODULE_COLUMNS, { key: "efficiency_pct", direction: "descending" }).map((m) => m.file)).toEqual(["B.PAN", "A.PAN", "C.PAN"]);
    expect(sortedEntries(modules, MODULE_COLUMNS, { key: "bifaciality", direction: "descending" }).map((m) => m.file)).toEqual(["C.PAN", "A.PAN", "B.PAN"]);
  });

  test("the inverters sort by their model, AC power, MPPT and maximum DC voltage", () => {
    expect(INVERTER_COLUMNS.map((column) => column.key)).toEqual(["model", "ac_kw", "mppt", "vdc_max_v"]);
  });

  test("on phone the orders are a select: each column both ways, in words", () => {
    expect(orderOptions(MODULE_COLUMNS, MODULE_START).map((option) => option.label)).toEqual([
      "Model, A to Z", "Model, Z to A", "Power, low to high", "Power, high to low", "Efficiency, high to low", "Efficiency, low to high", "Bifaciality, high to low", "Bifaciality, low to high",
    ]);
    expect(orderOptions(MODULE_COLUMNS, MODULE_START)[2]?.value).toBe("wp:ascending");
  });
});

describe("the rows", () => {
  test("a model that comes in two files is told apart by its data source", () => {
    expect(twinModels([aModule("A.PAN", 540, { model: "X" }), aModule("B.PAN", 540, { model: "X" }), aModule("C.PAN", 545)])).toEqual(new Set(["X"]));
  });

  test("the count says how many are shown of how many", () => {
    expect(countWords(20, 119, "modules")).toBe("20 of 119 modules");
  });
});

describe("the picker's first view (V2 · 10, D106; audit V2-72, V2-81)", () => {
  test("unfiltered, the line says what the library holds, and that a file of one's own is taken", () => {
    expect(pickerLineOf({ shown: 119, total: 119, makers: 5, thing: "module", fileKind: "PAN", isFiltered: false })).toBe("119 modules from 5 makers, or your own module file (PAN)");
    expect(pickerLineOf({ shown: 76, total: 76, makers: 1, thing: "inverter", fileKind: "OND", isFiltered: false })).toBe("76 inverters from 1 maker, or your own inverter file (OND)");
  });

  test("searched or filtered, how many are shown of how many", () => {
    expect(pickerLineOf({ shown: 20, total: 119, makers: 5, thing: "module", fileKind: "PAN", isFiltered: true })).toBe("20 of 119 modules");
  });

  test("Filter says when a filter narrows the list", () => {
    expect(FILTER).toBe("Filter");
    expect(filterWordsOf(false)).toBe("Filter");
    expect(filterWordsOf(true)).toBe("Filter · on");
  });

  test("the search reads the power too: Maker, model or power", () => {
    expect(matchesSearch({ maker: "Heliene Inc", model: "144HC M10", file: "a.PAN", power: "545 Wp" }, "545")).toBe(true);
    expect(matchesSearch({ maker: "Heliene Inc", model: "144HC M10", file: "a.PAN", power: "545 Wp" }, "550")).toBe(false);
  });
});

describe("the AC power that suits a roof, as the slider's span (D118)", () => {
  const stops = [0.7, 1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 350];

  test("the stops that hold the range: the highest at or under its low end, the lowest at or over its high end", () => {
    expect(kwSpanOf(stops, 128.49, 151.85)).toEqual([stops.indexOf(125), stops.indexOf(200)]);
    expect(kwSpanOf(stops, 100, 150)).toEqual([stops.indexOf(100), stops.indexOf(150)]);
  });

  test("a range past the library's ends stops at them", () => {
    expect(kwSpanOf(stops, 0.2, 0.5)).toEqual([0, 0]);
    expect(kwSpanOf(stops, 400, 900)).toEqual([stops.length - 1, stops.length - 1]);
  });
});
