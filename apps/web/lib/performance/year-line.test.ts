import { describe, expect, test } from "bun:test";
import type { Energy } from "../api";
import { nearestYear, TOTAL_ROW, YEAR_COLUMNS, yearAxisOf, yearEndsOf, yearPointsOf, yearRowsOf, yearSaidOf, yearsLineOf, yearTicksOf, yearTooltipOf } from "./year-line";
import { A, DEGRADATION_0_7 } from "./test-fixtures";

const energy = A.energy;

describe("the line of the 25 years (plan/phase-08-plan.md, step 12; the board \"25 years\")", () => {
  test("25 points across the width, year 1 at the left and year 25 at the right", () => {
    const points = yearPointsOf(energy);

    expect(points).toHaveLength(25);
    expect(points[0]!.year).toBe(1);
    expect(points[0]!.x).toBe(0);
    expect(points[9]!.x).toBeCloseTo(9 / 24, 6);
    expect(points[24]!.x).toBe(1);
  });

  test("the line on its axis, fitted to the run's years, not to zero: 540 to 620 MWh by 20 (V2 · 8: the axes labelled)", () => {
    const points = yearPointsOf(energy);

    expect(yearAxisOf(energy)).toEqual({ low: 540, high: 620, ticks: [540, 560, 580, 600, 620] });
    expect(points[0]!.y).toBeCloseTo((620 - 617.8405373922709) / 80, 6);
    expect(points[24]!.y).toBeCloseTo((620 - 547.8104814088715) / 80, 6);
    expect(points[12]!.y).toBeCloseTo((620 - 581.7727410447965) / 80, 6);
  });

  test("the first and the last year's energy stand beside the line's ends", () => {
    expect(yearEndsOf(energy)).toEqual({ first: "617.8", last: "547.8" });
  });

  test("the line over the chart: the total, and the ageing in plain words", () => {
    expect(yearsLineOf(energy, 0.5)).toBe("14,554 MWh in all · 0.5 % less each year");
    expect(yearsLineOf(DEGRADATION_0_7.energy, 0.7)).toBe("14,216 MWh in all · 0.7 % less each year");
    expect(yearsLineOf(energy, 0)).toBe("14,554 MWh in all · the same each year");
  });

  test("with no degradation every year is the same: the line lies in the middle", () => {
    const flat = { ...energy, years_mwh: Array<number>(25).fill(600) } as Energy;

    expect(yearPointsOf(flat).every((point) => point.y === 0.5)).toBe(true);
  });

  test("the years marked under the line, at their places across the width", () => {
    expect(yearTicksOf(energy)).toEqual([
      { year: 1, at: 0 },
      { year: 5, at: 4 / 24 },
      { year: 10, at: 9 / 24 },
      { year: 15, at: 14 / 24 },
      { year: 20, at: 19 / 24 },
      { year: 25, at: 1 },
    ]);
  });

  test("a degradation of 0.70 entered: year 1 unchanged, year 25 lower", () => {
    expect(yearEndsOf(DEGRADATION_0_7.energy)).toEqual({ first: "617.8", last: "522.0" });
  });
});

describe("the year under the pointer", () => {
  test("the nearest year to a share of the width, inside 1 to 25", () => {
    expect(nearestYear(0)).toBe(1);
    expect(nearestYear(9 / 24)).toBe(10);
    expect(nearestYear(9 / 24 + 0.02)).toBe(10);
    expect(nearestYear(9.5 / 24 + 0.001)).toBe(11);
    expect(nearestYear(1)).toBe(25);
    expect(nearestYear(-0.3)).toBe(1);
    expect(nearestYear(1.7)).toBe(25);
  });

  test("its tooltip, the value first; and what a screen reader hears", () => {
    expect(yearTooltipOf(energy, 10)).toEqual({ value: "590.6 MWh", label: "Year 10" });
    expect(yearSaidOf(energy, 10)).toBe("Year 10: 590.6 MWh");
  });
});

describe("the table of the years", () => {
  test("years 1, 5, 10, 15, 20, 25 and the total over 25 years, whole MWh", () => {
    const rows = yearRowsOf(energy);

    expect(rows.map((row) => row.year)).toEqual(["Year 1", "Year 5", "Year 10", "Year 15", "Year 20", "Year 25", "Total, 25 years"]);
    expect(rows[2]).toEqual({ key: "year-10", year: "Year 10", mwh: "590.6" });
    expect(rows[6]).toEqual({ key: TOTAL_ROW, year: "Total, 25 years", mwh: "14,554" });
  });

  test("the columns: the year as the name of its row, MWh as a number", () => {
    const row = yearRowsOf(energy)[0]!;

    expect(YEAR_COLUMNS.map((column) => [column.head, column.kind])).toEqual([
      ["Year", "name"],
      ["MWh", "number"],
    ]);
    expect(YEAR_COLUMNS.map((column) => column.value(row))).toEqual(["Year 1", "617.8"]);
  });
});
