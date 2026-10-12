// The energy to the grid each month (the board "V2 · 8 · Performance"; plan/phase-08-plan.md, step 12; guidelines.md,
// "Charts"): twelve bars on a labelled axis from zero (audit V2-71), each as tall as its share of the axis, the highest
// and the lowest labelled and no other; each month's kWh/kWp from its MWh and the DC capacity; the same figures as the rows of
// the Table tab, with the year as its last row. Pure.
import type { Column } from "../../components/ui/table-cells";
import { shown } from "../../components/ui/number-entry";
import type { Energy } from "../api";
import { axisOf, type Axis } from "./chart-axis";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type MonthBar = {
  month: string;
  /** The month by its initial, under the bar on touch. */
  initial: string;
  /** How tall the bar is, as a share of the axis, from 0 to 1. */
  share: number;
  /** The energy, one decimal: "68.4". */
  mwh: string;
  /** The specific yield of the month, whole kWh/kWp: "191". */
  kwhPerKwp: string;
  /** The label over the bar: the highest and the lowest month have one, no other. */
  label: string | null;
  /** The bar to a screen reader: "Mar: 68.4 MWh, 191 kWh/kWp". */
  name: string;
  /** The tooltip: the value first, then the month (decision 18). */
  tooltip: { value: string; label: string };
};

export type MonthRow = {
  key: string;
  month: string;
  mwh: string;
  kwhPerKwp: string;
};

/** The key of the last row of the table: the year, as the run's energy and specific yield. */
export const YEAR_ROW = "year";

/** A month's kWh/kWp: its MWh times a thousand over the DC capacity, whole. */
const specificYieldOf = (mwh: number, dcKwp: number) => shown((mwh * 1000) / dcKwp, 0);

/** The axis of the months, in MWh from zero. */
export const monthAxisOf = ({ monthly_mwh }: Pick<Energy, "monthly_mwh">): Axis => axisOf(monthly_mwh, { fromZero: true });

export function monthBarsOf({ monthly_mwh, dc_kwp }: Energy): MonthBar[] {
  const { high } = monthAxisOf({ monthly_mwh });
  const highest = Math.max(...monthly_mwh);
  const lowest = Math.min(...monthly_mwh);
  const labelled = new Set([monthly_mwh.indexOf(highest), monthly_mwh.indexOf(lowest)]);

  return monthly_mwh.map((value, index) => {
    const month = MONTHS[index] ?? `Month ${index + 1}`;
    const mwh = shown(value, 1);
    const kwhPerKwp = specificYieldOf(value, dc_kwp);
    return {
      month,
      initial: month.charAt(0),
      share: value / high,
      mwh,
      kwhPerKwp,
      label: labelled.has(index) ? mwh : null,
      name: `${month}: ${mwh} MWh, ${kwhPerKwp} kWh/kWp`,
      tooltip: { value: `${mwh} MWh · ${kwhPerKwp} kWh/kWp`, label: month },
    };
  });
}

/** The rows of the Table tab: the twelve months, and the year last. */
export function monthRowsOf(energy: Energy): MonthRow[] {
  const months = monthBarsOf(energy).map(({ month, mwh, kwhPerKwp }) => ({ key: month.toLowerCase(), month, mwh, kwhPerKwp }));
  return [...months, { key: YEAR_ROW, month: "Year", mwh: shown(energy.energy_mwh, 1), kwhPerKwp: shown(energy.specific_yield, 0) }];
}

/** The month as the name of its row, MWh and kWh/kWp as numbers at the right. */
export const MONTH_COLUMNS: ReadonlyArray<Column<MonthRow>> = [
  { key: "month", head: "Month", kind: "name", value: (row) => row.month },
  { key: "mwh", head: "MWh", kind: "number", value: (row) => row.mwh },
  { key: "kwh-kwp", head: "kWh/kWp", kind: "number", value: (row) => row.kwhPerKwp },
];
