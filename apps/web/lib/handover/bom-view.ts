// The bill of materials of the chosen option as a Table (plan/phase-09-plan.md, step 15, decision 7; the board "Handover,
// previews"): the engine's lines in its order, word for word; the quantities with a comma between thousands and no
// decimals; the caption; the text for the clipboard; the words of the toast. Pure; BillOfMaterials draws what it gives.
import { shown } from "../../components/ui/number-entry";
import type { Column } from "../../components/ui/table-cells";
import type { DesignOption } from "../api";
import { tableAsText } from "./copy-table";

export type BomLine = DesignOption["bom"][number];

export type BomView = {
  columns: ReadonlyArray<Column<BomLine>>;
  rows: readonly BomLine[];
  keyOf: (row: BomLine) => string;
  caption: string;
  /** The table as tab-separated text with a header line, for the clipboard. */
  text: string;
  /** What the toast says once the text is on the clipboard. */
  copied: string;
};

const COLUMNS: ReadonlyArray<Column<BomLine>> = [
  { key: "item", head: "Item", kind: "name", value: (row) => row.item },
  { key: "spec", head: "Specification", kind: "text", value: (row) => row.spec, words: true },
  { key: "qty", head: "Qty", kind: "number", value: (row) => shown(row.qty, 0) },
  { key: "unit", head: "Unit", kind: "text", value: (row) => row.unit },
];

/** A line by its item and its spec: one item may have a line per size, as the DC cable has since #191. */
const keyOf = (row: BomLine) => `${row.item} · ${row.spec}`;

export const BOM_COPIED = "Copied";

export function bomViewOf(option: DesignOption): BomView {
  return {
    columns: COLUMNS,
    rows: option.bom,
    keyOf,
    caption: `The bill of materials of option ${option.letter}`,
    text: tableAsText(COLUMNS, option.bom),
    copied: BOM_COPIED,
  };
}
