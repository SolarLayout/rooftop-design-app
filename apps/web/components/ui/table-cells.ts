// The columns of a table, and a row of it as a card on phone (Table).

import type { StatusKind } from "./StatusMark";

export type Mark = { kind: StatusKind; label: string };

/** A line of a cell: its label in small words before the value, words after it, or a quieter line under the value. */
export type CellLine = { label?: string; value: string; words?: string; isBelow?: boolean };

export type Column<Row> = {
  key: string;
  /** The head of the column; on a card, the label of the value. */
  head: string;
  /** `name` is what the row is called: there is one. A number stands at the right, in mono. */
  kind: "name" | "text" | "number";
  value: (row: Row) => string;
  /** The name of the row as the title of its card, where the table has less room: "Option D" for "D". */
  onCard?: (row: Row) => string;
  /** A second line under the value, quieter: the inverter under its MPPT. In the table only. */
  below?: (row: Row) => string;
  /** The cell as lines under each other, each with its label: Imp and Isc. In the table; the card shows `value`. */
  lines?: (row: Row) => readonly CellLine[];
  /** A status mark after the value. On a card it stands beside the title. */
  mark?: (row: Row) => Mark | null;
  /** Where the column is shown; without it, in both. */
  shown?: "table" | "card";
  /** What the column sorts by, a number or a string: with it the head is a button (table-sort.ts). */
  sortBy?: (row: Row) => number | string;
  /**
   * The value is words, not a figure: in Geist, at the left; on a card under the title across the width, without
   * the head, since the title says the row (the summary of Performance).
   */
  words?: boolean;
};

export type CardOfRow = {
  title: string;
  mark: Mark | null;
  /** A value of words shows no label on the card: it is said to a screen reader alone. */
  values: Array<{ key: string; label: string; value: string; words?: boolean }>;
};

/** The columns that the table shows. */
export function columnsOfTable<Row>(columns: ReadonlyArray<Column<Row>>): Array<Column<Row>> {
  return columns.filter((column) => column.shown !== "card");
}

/** What a cell of the table shows: its lines, or its value with the line under it, or its value. */
export function cellLinesOf<Row>(row: Row, column: Column<Row>): CellLine[] {
  if (column.lines) return [...column.lines(row)];
  const value: CellLine = { value: column.value(row) };
  return column.below ? [value, { value: column.below(row), isBelow: true }] : [value];
}

/** A row as a card: its name as the title, its mark, and every other value with its label; a value that is empty is left off. */
export function cardOf<Row>(row: Row, columns: ReadonlyArray<Column<Row>>): CardOfRow {
  const onCard = columns.filter((column) => column.shown !== "table");
  const name = onCard.find((column) => column.kind === "name");
  const marks = onCard.flatMap((column) => column.mark?.(row) ?? []);

  return {
    title: name ? (name.onCard?.(row) ?? name.value(row)) : "",
    mark: marks[0] ?? null,
    values: onCard
      .filter((column) => column !== name && column.value(row) !== "")
      .map((column) =>
        column.words
          ? { key: column.key, label: column.head, value: column.value(row), words: true }
          : { key: column.key, label: column.head, value: column.value(row) },
      ),
  };
}
