"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/table-cells";
import type { MpptRow, MpptTable as MpptTableView } from "@/lib/studio/mppt-table";
import { SECTION_LINE, SECTION_TEXT } from "./inspector-look";
import { classNames } from "@/components/ui/class-names";

const COLUMNS: ReadonlyArray<Column<MpptRow>> = [
  { key: "mppt", head: "MPPT", kind: "name", value: (row) => row.mppt, below: (row) => row.inverter, onCard: (row) => row.title },
  { key: "strings", head: "Strings", kind: "number", value: (row) => row.strings },
  {
    key: "current",
    head: "Current",
    kind: "text",
    value: (row) => row.imp.value,
    lines: (row) => [
      { label: "Imp", value: row.imp.value, words: row.imp.words ?? undefined },
      { label: "Isc", value: row.isc.value, words: row.isc.words ?? undefined },
    ],
    shown: "table",
  },
  { key: "kwp", head: "kWp", kind: "number", value: (row) => row.kwp, mark: (row) => row.mark },
  { key: "imp", head: "Imp", kind: "number", value: (row) => [row.imp.value, row.imp.words].filter(Boolean).join(" "), shown: "card" },
  { key: "isc", head: "Isc", kind: "number", value: (row) => [row.isc.value, row.isc.words].filter(Boolean).join(" "), shown: "card" },
];

type Props = {
  table: MpptTableView;
  /** Opens "Inverter limits and cabling" and puts the focus in the current per MPPT. */
  onEnterCurrent: () => void;
};

/**
 * The MPPT loading of the chosen option (the board "Inverter and sizing"; plan/phase-07-plan.md, decision 17):
 * under the options, a row for each MPPT that has strings, Imp and Isc each of its limit, kWp and the mark; on
 * phone the rows as cards. Where a limit is not known the API's note stands under the table, with the way to
 * enter the current per MPPT.
 */
export function MpptTable({ table, onEnterCurrent }: Props) {
  const heading = useId();
  return (
    <section aria-labelledby={heading} data-testid="mppt-table" className="flex flex-col gap-2">
      <div className={classNames("flex items-baseline gap-3", SECTION_LINE)}>
        <h2 id={heading} className={SECTION_TEXT}>
          MPPT loading
        </h2>
        <span className="ml-auto type-caption whitespace-nowrap text-text-3">{table.of}</span>
      </div>
      <Table caption={table.caption} columns={COLUMNS} rows={table.rows} keyOf={(row) => row.key} dense cardColumns={2} />
      {table.note ? (
        <div data-testid="mppt-note" className="flex flex-col gap-1.5 rounded-item border border-note-line bg-note-surface px-2.5 py-2 type-caption text-text-2">
          <p>{table.note}</p>
          <button type="button" className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 self-start font-medium text-text focus-ring desktop:min-h-0" onClick={onEnterCurrent}>
            Enter the current per MPPT
            <Icon name="arrow-right" size={14} className="text-text-2" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
