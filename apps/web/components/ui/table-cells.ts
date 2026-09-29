// The columns of a table, and a row of it as a card on phone (Table).

import type { StatusKind } from "./StatusMark";

export type Mark = { kind: StatusKind; label: string };

export type Column<Row> = {
  key: string;
  /** The head of the column; on a card, the label of the value. */
  head: string;
  /** `name` is what the row is called: there is one. A number stands at the right, in mono. */
  kind: "name" | "text" | "number";
  value: (row: Row) => string;
  /** The name of the row as the title of its card, where the table has less room: "Option D" for "D". */
  onCard?: (row: Row) => string;
  /** A status mark after the value. On a card it stands beside the title. */
  mark?: (row: Row) => Mark | null;
  /** Where the column is shown; without it, in both. */
  shown?: "table" | "card";
};

export type CardOfRow = {
  title: string;
  mark: Mark | null;
  values: Array<{ key: string; label: string; value: string }>;
};

/** The columns that the table shows. */
export function columnsOfTable<Row>(columns: ReadonlyArray<Column<Row>>): Array<Column<Row>> {
  return columns.filter((column) => column.shown !== "card");
}

/** A row as a card: its name as the title, its mark, and every other value with its label. */
export function cardOf<Row>(row: Row, columns: ReadonlyArray<Column<Row>>): CardOfRow {
  const onCard = columns.filter((column) => column.shown !== "table");
  const name = onCard.find((column) => column.kind === "name");
  const marks = onCard.flatMap((column) => column.mark?.(row) ?? []);

  return {
    title: name ? (name.onCard?.(row) ?? name.value(row)) : "",
    mark: marks[0] ?? null,
    values: onCard
      .filter((column) => column !== name)
      .map((column) => ({ key: column.key, label: column.head, value: column.value(row) })),
  };
}
