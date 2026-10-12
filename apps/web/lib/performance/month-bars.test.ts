import { describe, expect, test } from "bun:test";
import type { Energy } from "../api";
import { MONTH_COLUMNS, monthAxisOf, monthBarsOf, monthRowsOf, YEAR_ROW } from "./month-bars";
import { A } from "./test-fixtures";

const energy = A.energy;

describe("the bars of the months (plan/phase-08-plan.md, step 12; guidelines.md, \"Charts\")", () => {
  test("twelve bars, Jan to Dec, each as tall as its share of the axis, from zero (V2 · 8: the axis labelled)", () => {
    const bars = monthBarsOf(energy);

    expect(bars.map((bar) => bar.month)).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
    expect(bars[2]!.share).toBeCloseTo(68.3587805746761 / 80, 6);
    expect(bars[6]!.share).toBeCloseTo(31.498840316903788 / 80, 6);
    expect(bars.every((bar) => bar.share > 0 && bar.share <= 1)).toBe(true);
  });

  test("the axis in MWh from 0 to 80 by 20", () => {
    expect(monthAxisOf(energy)).toEqual({ low: 0, high: 80, ticks: [0, 20, 40, 60, 80] });
  });

  test("on touch each month by its initial", () => {
    expect(monthBarsOf(energy).map((bar) => bar.initial).join("")).toBe("JFMAMJJASOND");
  });

  test("the extremes are labelled and no other: March 68.4 the highest, July 31.5 the lowest", () => {
    const bars = monthBarsOf(energy);

    expect(bars.map((bar) => bar.label)).toEqual([null, null, "68.4", null, null, null, "31.5", null, null, null, null, null]);
  });

  test("each month's kWh/kWp is its MWh times a thousand over the DC capacity, whole: 191 for March", () => {
    const bars = monthBarsOf(energy);

    expect(bars[2]!.kwhPerKwp).toBe("191");
    expect(bars[6]!.kwhPerKwp).toBe("88");
    expect(bars[0]!.mwh).toBe("62.0");
  });

  test("a bar to a screen reader, and its tooltip with the value first", () => {
    const march = monthBarsOf(energy)[2]!;

    expect(march.name).toBe("Mar: 68.4 MWh, 191 kWh/kWp");
    expect(march.tooltip).toEqual({ value: "68.4 MWh · 191 kWh/kWp", label: "Mar" });
  });

  test("months of the same energy: the highest and the lowest each labelled once", () => {
    const flat = { ...energy, monthly_mwh: Array<number>(12).fill(50) } as Energy;

    const bars = monthBarsOf(flat);

    expect(bars.filter((bar) => bar.label !== null)).toHaveLength(1);
    expect(bars[0]!.label).toBe("50.0");
    expect(bars.every((bar) => bar.share === 50 / 60)).toBe(true);
  });
});

describe("the table of the months", () => {
  test("twelve rows and the year: MWh with one decimal, kWh/kWp whole; the year the run's energy and specific yield", () => {
    const rows = monthRowsOf(energy);

    expect(rows).toHaveLength(13);
    expect(rows[2]).toEqual({ key: "mar", month: "Mar", mwh: "68.4", kwhPerKwp: "191" });
    expect(rows[12]).toEqual({ key: YEAR_ROW, month: "Year", mwh: "617.8", kwhPerKwp: "1,729" });
  });

  test("the columns: the month as the name of its row, the energy and the yield as numbers, each head the thing and its unit", () => {
    const row = monthRowsOf(energy)[6]!;

    expect(MONTH_COLUMNS.map((column) => [column.head, column.kind])).toEqual([
      ["Month", "name"],
      ["Energy, MWh", "number"],
      ["Yield, kWh/kWp", "number"],
    ]);
    expect(MONTH_COLUMNS.map((column) => column.value(row))).toEqual(["Jul", "31.5", "88"]);
  });
});
