"use client";

import { useMemo } from "react";
import { FailedRow } from "@/components/shell/UnderTheTitle";
import { classNames } from "@/components/ui/class-names";
import type { ExportedFile } from "@/lib/api";
import { csvColumnsOf } from "@/lib/handover/csv-columns";
import { cellShownOf, csvHeadOf, hourlyFailedOf, type CsvHead } from "@/lib/handover/csv-head";
import { useBlobText } from "./use-blob-text";

type Props = {
  /** The CSV of this edit of the document; null while it has not come. */
  file: ExportedFile | null;
  /** Why it did not come, in the API's words; null otherwise. */
  failure: string | null;
  /** Try again under the head: the CSV is asked for once more. */
  onTryAgain: () => void;
};

// The board "V2 · 9 · Handover and Home", the hourly data: the table in a bordered box, each column by its plain name with
// its unit and the file's own name under it (audit V2-94), the rows in mono, the figures at the right; the caption under the
// table. The box scrolls sideways where the six columns do not fit, never the page.
const CARD = "overflow-x-auto rounded-row border border-line";
const HEAD = "px-3 py-2 align-bottom";
const CELL = "h-9 border-t border-line-subtle px-3 type-mono-touch desktop:type-mono whitespace-nowrap";
const TIME = 0;

function Rows({ head }: { head: CsvHead }) {
  const align = (column: number) => (column === TIME ? "text-left" : "text-right");
  return (
    <table data-testid="csv-table" aria-label="The first hours of the file" className="w-full border-collapse">
      <thead>
        <tr>
          {csvColumnsOf(head.header).map((column, index) => (
            <th key={column.file} scope="col" className={classNames(HEAD, align(index))}>
              <span className="block type-strong-touch desktop:type-strong">{column.name}</span>
              {column.under ? <span className="block type-unit font-normal text-text-3">{column.under}</span> : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {head.rows.map((row) => (
          <tr key={row[TIME]} data-testid="csv-row">
            {row.map((cell, column) => (
              <td key={column} className={classNames(CELL, align(column))}>
                {cellShownOf(column, cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The body of the hourly data (plan/phase-09-plan.md, step 20, decision 8; V2 · 9): the CSV asked once per edit and kept,
 * its columns by their plain names and its first five hours, the caption counting the file's hours. While
 * the file comes, a breathing block of the table's shape; when it did not, the API's words with Try again.
 */
export function HourlyPreview({ file, failure, onTryAgain }: Props) {
  const text = useBlobText(file?.blob ?? null);
  const head = useMemo(() => (text === null ? null : csvHeadOf(text)), [text]);

  if (head === null) {
    if (failure !== null) return <FailedRow failed={hourlyFailedOf(failure)} onTryAgain={onTryAgain} />;
    return <div data-testid="hourly-skeleton" aria-hidden="true" className="h-80 w-full rounded-card bg-surface-2 breathing" />;
  }
  return (
    <div data-testid="hourly-data" className="flex min-w-0 flex-col gap-4">
      {/* The card scrolls sideways where six columns do not fit: it takes the focus, so that the keyboard can scroll it. */}
      <section aria-label="The first rows of the file" tabIndex={0} className={classNames(CARD, "focus-ring")}>
        <Rows head={head} />
      </section>
      <p data-testid="csv-caption" className="type-body-touch desktop:type-body text-text-2">
        {head.caption}
      </p>
    </div>
  );
}
