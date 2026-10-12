// The hourly data's preview (plan/phase-09-plan.md, step 20, decision 8; the board "Handover, previews"): the header and the
// first rows of the CSV as the file holds them, parsed from its first lines, and the count of the file's rows, which are the
// weather's hours. The engine writes the file with pandas (export_csv_bytes): a header line, one line per hour, no quoting,
// "\n" after each line. Pure.
import { shown } from "../../components/ui/number-entry";
import { TRY_AGAIN } from "../../components/shell/vitals-view";
import type { FailedRow } from "../performance/page-view";

export type CsvHead = {
  /** The names of the columns, as the file's first line has them. */
  header: string[];
  /** The first rows, cell for cell as the file holds them. */
  rows: string[][];
  /** How many rows the file has, the header not counted. */
  count: number;
  /** "The first 5 of 8,760 hours. Each column is named in the file as under its name here." */
  caption: string;
};

/** How many rows the preview shows: the board's five (V2 · 9). */
export const SHOWN_ROWS = 5;

const LINE_END = /\r?\n/;

/** The lines of the text, the empty end after the last newline not counted. */
function linesOf(text: string): string[] {
  const lines = text.split(LINE_END);
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

export function csvHeadOf(text: string, rowsShown = SHOWN_ROWS): CsvHead {
  const [first, ...rest] = linesOf(text);
  const header = first === undefined ? [] : first.split(",");
  const rows = rest.slice(0, rowsShown).map((line) => line.split(","));
  const count = rest.length;
  return { header, rows, count, caption: `The first ${shown(rows.length, 0)} of ${shown(count, 0)} hours. Each column is named in the file as under its name here.` };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HOUR = /^\d{4}-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/;

/** A cell as it is read: the hour (the first column) by its day and time, "1 Jan 02:00"; a figure with one decimal. */
export function cellShownOf(column: number, cell: string): string {
  if (column === 0) {
    const hour = HOUR.exec(cell);
    return hour ? `${Number(hour[2])} ${MONTHS[Number(hour[1]) - 1] ?? ""} ${hour[3]}` : cell;
  }
  const value = Number(cell);
  if (cell.trim() === "" || !Number.isFinite(value)) return cell;
  return shown(Math.abs(value) < 0.05 ? 0 : value, 1);
}

export const HOURS_NOT_MADE = { title: "The hourly data was not made", detail: "There is no preview yet" } as const;

/** The CSV did not come: what did not happen, with the API's words and Try again. */
export const hourlyFailedOf = (message: string): FailedRow => ({ ...HOURS_NOT_MADE, action: TRY_AGAIN, message });
