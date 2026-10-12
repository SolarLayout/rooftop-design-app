// The energy over 25 years (the boards "25 years" and "V2 · 8 · Performance"; plan/phase-08-plan.md, step 12): the 25
// years as points of one line, across the width in order and, in height, on an axis fitted to the run's years rather than
// to zero, so that the fall is seen, the axes labelled (audit V2-71); the first and last years' energy at the line's ends;
// the line over the chart with the total and the ageing; six years marked under the line; the year nearest to the pointer with its tooltip; the rows of the Table
// tab, six years and the total. Pure.
import type { Column } from "../../components/ui/table-cells";
import { shown } from "../../components/ui/number-entry";
import type { Energy } from "../api";
import { axisOf, type Axis } from "./chart-axis";

export type YearPoint = {
  /** 1 to 25. */
  year: number;
  /** Across the width, from 0 at year 1 to 1 at the last year. */
  x: number;
  /** Down the plot, from 0 at the axis's top to 1 at its foot. */
  y: number;
};

/** A year marked under the line, and its place across the width, from 0 to 1. */
export type YearTick = { year: number; at: number };

export type YearRow = {
  key: string;
  year: string;
  mwh: string;
};

/** The years marked under the line and in the table. */
export const LABELLED_YEARS = [1, 5, 10, 15, 20, 25] as const;

/** The key of the last row of the table: the total over the 25 years. */
export const TOTAL_ROW = "total";

const energyOfYear = ({ years_mwh }: Energy, year: number) => shown(years_mwh[year - 1] ?? 0, 1);

/** The axis of the years, in MWh, fitted to them. */
export const yearAxisOf = ({ years_mwh }: Pick<Energy, "years_mwh">): Axis => axisOf(years_mwh, { fromZero: false });

export function yearPointsOf({ years_mwh }: Energy): YearPoint[] {
  const { low, high } = yearAxisOf({ years_mwh });
  const last = years_mwh.length - 1;
  return years_mwh.map((value, index) => ({
    year: index + 1,
    x: last > 0 ? index / last : 0,
    y: (high - value) / (high - low),
  }));
}

/** The energy of the first and the last year, beside the line's ends. */
export function yearEndsOf(energy: Energy): { first: string; last: string } {
  return { first: energyOfYear(energy, 1), last: energyOfYear(energy, energy.years_mwh.length) };
}

/** The line over the chart: "14,554 MWh in all · 0.5 % less each year". */
export function yearsLineOf(energy: Pick<Energy, "total_25_years_mwh">, degradationPct: number): string {
  const ageing = degradationPct > 0 ? `${shown(degradationPct, 1)} % less each year` : "the same each year";
  return `${shown(energy.total_25_years_mwh, 0)} MWh in all · ${ageing}`;
}

export function yearTicksOf({ years_mwh }: Energy): YearTick[] {
  const last = years_mwh.length - 1;
  return LABELLED_YEARS.map((year) => ({ year, at: last > 0 ? (year - 1) / last : 0 }));
}

/** The year nearest to a share of the width, from the pointer or the finger; at the ends, the first or the last year. */
export function nearestYear(share: number, count = 25): number {
  const year = Math.round(share * (count - 1)) + 1;
  return Math.min(count, Math.max(1, year));
}

/** The tooltip of a year: the value first, then the year (decision 18). */
export function yearTooltipOf(energy: Energy, year: number): { value: string; label: string } {
  return { value: `${energyOfYear(energy, year)} MWh`, label: `Year ${year}` };
}

/** The year under the keyboard focus, to a screen reader. */
export function yearSaidOf(energy: Energy, year: number): string {
  return `Year ${year}: ${energyOfYear(energy, year)} MWh`;
}

/** The rows of the Table tab: the six years, and the total last. */
export function yearRowsOf(energy: Energy): YearRow[] {
  const years = LABELLED_YEARS.map((year) => ({ key: `year-${year}`, year: `Year ${year}`, mwh: energyOfYear(energy, year) }));
  return [...years, { key: TOTAL_ROW, year: "Total, 25 years", mwh: shown(energy.total_25_years_mwh, 0) }];
}

/** The year as the name of its row, MWh as a number at the right. */
export const YEAR_COLUMNS: ReadonlyArray<Column<YearRow>> = [
  { key: "year", head: "Year", kind: "name", value: (row) => row.year },
  { key: "mwh", head: "MWh", kind: "number", value: (row) => row.mwh },
];
