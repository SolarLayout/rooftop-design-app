// A table copied for a spreadsheet (plan/phase-09-plan.md, decision 7): the rows as tab-separated lines with a header line,
// what is shown in the order shown, written to the clipboard. Pure, but for the clipboard, which a test gives its own.

/** A column as the copy needs it: its head and the value of a row, as the table shows them. */
export type TextColumn<Row> = { head: string; value: (row: Row) => string };

/** What the toast says when the clipboard refused: what happened, and what to do. */
export const COULD_NOT_COPY = "The table could not be copied. Select it and copy by hand.";

/** The table as text: a header line, then one line per row, the cells separated by tabs, no newline at the end. */
export function tableAsText<Row>(columns: ReadonlyArray<TextColumn<Row>>, rows: readonly Row[]): string {
  const header = columns.map((column) => column.head).join("\t");
  return [header, ...rows.map((row) => columns.map((column) => column.value(row)).join("\t"))].join("\n");
}

const writeToTheClipboard = (text: string) => navigator.clipboard.writeText(text);

/** Writes *text* to the clipboard. A clipboard that refuses rejects with COULD_NOT_COPY, for the toast. */
export async function copyTable(text: string, write: (text: string) => Promise<void> = writeToTheClipboard): Promise<void> {
  try {
    await write(text);
  } catch {
    throw new Error(COULD_NOT_COPY);
  }
}
