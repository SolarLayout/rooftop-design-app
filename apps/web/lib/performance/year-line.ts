// The energy over 25 years (the board "25 years"; plan/phase-08-plan.md, step 12): the 25 years as points of one line,
// across the width in order and, in height, fitted to the run's own extremes rather than to zero, so that the fall is
// seen; six years labelled under the line; the year nearest to the pointer with its tooltip; the rows of the Table
// tab, six years and the total. Pure.
import type { Column } from "../../components/ui/table-cells";
import { shown } from "../../components/ui/number-entry";
import type { Energy } from "../api";

export type YearPoint = {
  /** 1 to 25. */
  year: number;
  /** Across the width, from 0 at year 1 to 1 at the last year. */
  x: number;
  /** Down the band of the line, from 0 at the highest year to 1 at the lowest; 0.5 when every year is the same. */
  y: number;
};

export type YearLabel = {
  year: number;
  /** "Year 1" for the first, the number alone for the others. */
  label: string;
  /** The energy of the year, one decimal. */
  mwh: string;
};

export type YearRow = {
  key: string;
  year: string;
  mwh: string;
};

/** The years that stand under the line and in the table. */
export const LABELLED_YEARS = [1, 5, 10, 15, 20, 25] as const;

/** The key of the last row of the table: the total over the 25 years. */
export const TOTAL_ROW = "total";

const energyOfYear = ({ years_mwh }: Energy, year: number) => shown(years_mwh[year - 1] ?? 0, 1);

export function yearPointsOf({ years_mwh }: Energy): YearPoint[] {
  const highest = Math.max(...years_mwh);
  const lowest = Math.min(...years_mwh);
  const last = years_mwh.length - 1;
  return years_mwh.map((value, index) => ({
    year: index + 1,
    x: last > 0 ? index / last : 0,
    y: highest > lowest ? (highest - value) / (highest - lowest) : 0.5,
  }));
}

export function yearLabelsOf(energy: Energy): YearLabel[] {
  return LABELLED_YEARS.map((year) => ({ year, label: year === 1 ? "Year 1" : String(year), mwh: energyOfYear(energy, year) }));
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
