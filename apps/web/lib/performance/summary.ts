// The summary of the chosen option (the board "Performance"; plan/phase-08-plan.md, decision 16): the rows the
// engine sums the design up in, in its order and words, as the rows and columns of a Table. Pure.
import type { Column } from "../../components/ui/table-cells";
import type { DesignOption } from "../api";

export type SummaryRowView = {
  /** What tells one row from another: its label, and its place where a label comes twice. */
  key: string;
  label: string;
  value: string;
};

// NFKC writes a subscript as its digit: "CO₂ avoided" is "co2-avoided".
const keyOf = (label: string) =>
  label
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function summaryRowsOf({ summary }: DesignOption): SummaryRowView[] {
  const seen = new Map<string, number>();
  return summary.map(({ label, value }) => {
    const key = keyOf(label);
    const times = (seen.get(key) ?? 0) + 1;
    seen.set(key, times);
    return { key: times === 1 ? key : `${key}-${times}`, label, value };
  });
}

/** The item as the name of its row, the value as words in Geist; on phone a card with the item as its title and the value under it. */
export const SUMMARY_COLUMNS: ReadonlyArray<Column<SummaryRowView>> = [
  { key: "item", head: "Item", kind: "name", value: (row) => row.label },
  { key: "value", head: "Value", kind: "text", words: true, value: (row) => row.value },
];
