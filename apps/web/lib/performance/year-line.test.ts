import { describe, expect, test } from "bun:test";
import type { Energy } from "../api";
import { nearestYear, TOTAL_ROW, YEAR_COLUMNS, yearLabelsOf, yearPointsOf, yearRowsOf, yearSaidOf, yearTooltipOf } from "./year-line";
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

  test("the line is fitted to the run's own extremes, not to zero: the highest year at the top, the lowest at the bottom", () => {
    const points = yearPointsOf(energy);

    expect(points[0]!.y).toBe(0);
    expect(points[24]!.y).toBe(1);
    expect(points[12]!.y).toBeCloseTo((617.8405373922709 - 581.7727410447965) / (617.8405373922709 - 547.8104814088715), 6);
  });

  test("with no degradation every year is the same: the line lies in the middle", () => {
    const flat = { ...energy, years_mwh: Array<number>(25).fill(600) } as Energy;

    expect(yearPointsOf(flat).every((point) => point.y === 0.5)).toBe(true);
  });

  test("the six labelled years, year 1 by its name, with their energy", () => {
    expect(yearLabelsOf(energy)).toEqual([
      { year: 1, label: "Year 1", mwh: "617.8" },
      { year: 5, label: "5", mwh: "605.6" },
      { year: 10, label: "10", mwh: "590.6" },
      { year: 15, label: "15", mwh: "576.0" },
      { year: 20, label: "20", mwh: "561.7" },
      { year: 25, label: "25", mwh: "547.8" },
    ]);
  });

  test("a degradation of 0.70 entered: year 1 unchanged, the rest lower", () => {
    const labels = yearLabelsOf(DEGRADATION_0_7.energy);

    expect(labels[0]!.mwh).toBe("617.8");
    expect(labels[5]!.mwh).toBe("522.0");
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
