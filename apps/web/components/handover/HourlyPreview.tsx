"use client";

import { useMemo } from "react";
import { FailedRow } from "@/components/shell/UnderTheTitle";
import { classNames } from "@/components/ui/class-names";
import type { ExportedFile } from "@/lib/api";
import { csvColumnsOf } from "@/lib/handover/csv-columns";
import { csvHeadOf, hourlyFailedOf, type CsvHead } from "@/lib/handover/csv-head";
import { FactRows } from "./FactRows";
import { useBlobText } from "./use-blob-text";

type Props = {
  /** The CSV of this edit of the document; null while it has not come. */
  file: ExportedFile | null;
  /** Why it did not come, in the API's words; null otherwise. */
  failure: string | null;
  /** Try again under the head: the CSV is asked for once more. */
  onTryAgain: () => void;
};

// The board "Handover, previews", the hourly data: the table in a card (surface-1, radius 18, shadow-card), the header and the
// rows in mono 13, the time column in text-2, the figures at the right; the caption under the table. The card scrolls sideways
// where the six columns do not fit, never the page.
const CARD = "overflow-x-auto rounded-card border border-line bg-surface-1 px-6 pt-3 pb-5 shadow-card";
const HEAD = "h-9 border-b border-line px-2 type-value-small font-medium whitespace-nowrap text-text-2";
const CELL = "h-9 border-b border-line-subtle px-2 type-value-small whitespace-nowrap";
const TIME = 0;

function Rows({ head }: { head: CsvHead }) {
  const align = (column: number) => (column === TIME ? "text-left" : "text-right");
  return (
    <table data-testid="csv-table" className="w-full border-collapse">
      <caption data-testid="csv-caption" className="caption-bottom pt-2.5 text-left type-caption text-text-2">
        {head.caption}
      </caption>
      <thead>
        <tr>
          {head.header.map((name, column) => (
            <th key={name} scope="col" className={classNames(HEAD, align(column))}>
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {head.rows.map((row) => (
          <tr key={row[TIME]} data-testid="csv-row">
            {row.map((cell, column) => (
              <td key={column} className={classNames(CELL, align(column), column === TIME && "text-text-2")}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The body of the hourly data (plan/phase-09-plan.md, step 20, decision 8): the CSV asked once per edit and kept, its header
 * and first eight rows as the file holds them, the caption counting the file's rows, and under it what each column is. While
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
      <FactRows title="Columns" rows={csvColumnsOf(head.header)} mono nameWidth="m" testId="csv-column" />
    </div>
  );
}
