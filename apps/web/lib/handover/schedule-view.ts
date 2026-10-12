// The DC cable schedule of the chosen option as a Table (plan/phase-09-plan.md, step 16, decision 7; the board "Handover,
// previews"): every string with the engine's nine columns in its order, sortable on the first eight, the engine's order
// by default, a drop over 1 % marked (issue 179, item 27); a total row with the count of strings and the lengths' sum; the caption; the text for the clipboard, what is
// shown in the order shown; the words of the toast. Pure; CableSchedule draws what it gives.
import { shown } from "../../components/ui/number-entry";
import type { Column, Mark } from "../../components/ui/table-cells";
import { sortedRows, type Sort } from "../../components/ui/table-sort";
import type { CableRow, DesignOption } from "../api";
import { tableAsText } from "./copy-table";

/** A row of the table: a string with its cells as they are shown, or the total row, which has no string. */
export type ScheduleLine = {
  key: string;
  /** The engine's row; null for the total. */
  raw: CableRow | null;
  string: string;
  inverter: string;
  mppt: string;
  modules: string;
  vocCold: string;
  isc: string;
  length: string;
  drop: string;
  cable: string;
};

export type ScheduleView = {
  columns: ReadonlyArray<Column<ScheduleLine>>;
  /** The strings in the sort's order, then the total row. */
  rows: readonly ScheduleLine[];
  keyOf: (row: ScheduleLine) => string;
  /** The key of the total row. */
  total: string;
  caption: string;
  text: string;
  copied: string;
};

const TOTAL = "total";
export const SCHEDULE_COPIED = "Copied";

/** The most a string's cable drops of its voltage at the maximum power point, as the engine sizes it. */
const DROP_LIMIT_PCT = 1;
const OVER_THE_LIMIT: Mark = { kind: "note", label: "Over 1 % even at 10 mm². Shorten the run or move the inverter nearer." };

/** The number of a string from its label, so that S10 sorts after S9. */
const numberOfString = (label: string) => Number(label.match(/\d+$/)?.[0] ?? 0);

const COLUMNS: ReadonlyArray<Column<ScheduleLine>> = [
  { key: "string", head: "String", kind: "name", value: (row) => row.string, sortBy: (row) => (row.raw ? numberOfString(row.raw.string) : 0) },
  { key: "inverter", head: "Inverter", kind: "text", value: (row) => row.inverter, sortBy: (row) => row.raw?.inverter ?? "" },
  { key: "mppt", head: "MPPT", kind: "number", value: (row) => row.mppt, sortBy: (row) => row.raw?.mppt ?? 0 },
  { key: "modules", head: "Modules", kind: "number", value: (row) => row.modules, sortBy: (row) => row.raw?.modules ?? 0 },
  { key: "vocCold", head: "Voc cold (V)", kind: "number", value: (row) => row.vocCold, sortBy: (row) => row.raw?.voc_cold_v ?? 0 },
  { key: "isc", head: "Isc (A)", kind: "number", value: (row) => row.isc, sortBy: (row) => row.raw?.isc_a ?? 0 },
  { key: "length", head: "DC cable (m)", kind: "number", value: (row) => row.length, sortBy: (row) => row.raw?.length_m ?? 0 },
  {
    key: "drop",
    head: "Drop (%)",
    kind: "number",
    value: (row) => row.drop,
    sortBy: (row) => row.raw?.drop_pct ?? 0,
    mark: (row) => (row.raw !== null && row.raw.drop_pct > DROP_LIMIT_PCT ? OVER_THE_LIMIT : null),
  },
  { key: "cable", head: "Cable", kind: "text", value: (row) => row.cable, words: true },
];

const keyOf = (row: ScheduleLine) => row.key;

function lineOf(row: CableRow): ScheduleLine {
  return {
    key: row.string,
    raw: row,
    string: row.string,
    inverter: row.inverter,
    mppt: shown(row.mppt, 0),
    modules: shown(row.modules, 0),
    vocCold: shown(row.voc_cold_v, 0),
    isc: shown(row.isc_a, 2),
    length: shown(row.length_m, 1),
    drop: shown(row.drop_pct, 2),
    cable: row.size,
  };
}

function totalOf(option: DesignOption): ScheduleLine {
  const strings = option.cable_schedule.length;
  const sum = option.cable_schedule.reduce((total, row) => total + row.length_m, 0);
  return { key: TOTAL, raw: null, string: `${shown(strings, 0)} ${strings === 1 ? "string" : "strings"}`, inverter: "", mppt: "", modules: "", vocCold: "", isc: "", length: shown(sum, 1), drop: "", cable: "" };
}

function captionOf(option: DesignOption, sort: Sort | null): string {
  if (sort === null) return `The cable schedule of option ${option.letter}, by string`;
  const head = COLUMNS.find((column) => column.key === sort.key)?.head ?? sort.key;
  return `Sorted by ${head}, ${sort.direction === "descending" ? "downwards" : "upwards"}`;
}

/** The schedule of *option* in the order of *sort*, the engine's order without one. */
export function scheduleViewOf(option: DesignOption, sort: Sort | null): ScheduleView {
  const rows = [...sortedRows(option.cable_schedule.map(lineOf), COLUMNS, sort), totalOf(option)];
  return { columns: COLUMNS, rows, keyOf, total: TOTAL, caption: captionOf(option, sort), text: tableAsText(COLUMNS, rows), copied: SCHEDULE_COPIED };
}
