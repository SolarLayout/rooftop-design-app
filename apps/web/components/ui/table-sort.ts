// The sorting of a table (Table; docs/design/components.md, "Table"): a head whose column sorts is a button; a first
// press sorts upwards, a second downwards, a third gives the order given back. The table shows the rows as they are
// given and says the state in its heads; whoever gives the rows sorts them with sortedRows, so that a copy of the table
// is of what is shown. Pure.

import type { Column } from "./table-cells";

export type SortDirection = "ascending" | "descending";
/** The column sorted by, and its direction. Null: the order given. */
export type Sort = { key: string; direction: SortDirection };
/** What a column sorts by: a number, or a string compared as words. */
export type SortValue = number | string;

const compare = (a: SortValue, b: SortValue): number => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b)));

/** The rows in the order of *sort*, stable: rows that are equal keep the order given. Without a sort, or a column that does not sort, the rows as given. */
export function sortedRows<Row>(rows: readonly Row[], columns: ReadonlyArray<Column<Row>>, sort: Sort | null): Row[] {
  const sortBy = sort === null ? undefined : columns.find((column) => column.key === sort.key)?.sortBy;
  if (!sortBy || sort === null) return [...rows];
  const sign = sort.direction === "ascending" ? 1 : -1;
  return [...rows].sort((a, b) => sign * compare(sortBy(a), sortBy(b)));
}

/** The state after a press on the head of *key*: upwards, then downwards, then the order given; another head upwards by it. */
export function nextSort(sort: Sort | null, key: string): Sort | null {
  if (sort === null || sort.key !== key) return { key, direction: "ascending" };
  return sort.direction === "ascending" ? { key, direction: "descending" } : null;
}

/** What the head of *key* says of the sort: its direction when it is the one, none otherwise. */
export function ariaSortOf(sort: Sort | null, key: string): SortDirection | "none" {
  return sort !== null && sort.key === key ? sort.direction : "none";
}
