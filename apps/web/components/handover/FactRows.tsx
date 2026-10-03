import { classNames } from "@/components/ui/class-names";
import type { FactRow } from "@/lib/handover/earth-view";

type Props = {
  /** The section's name over the rows, in the section type: "Layers", "In the file", "Columns". */
  title: string;
  rows: readonly FactRow[];
  /** The names are the file's own (a layer, a placemark, a column): in mono. Otherwise in words. */
  mono?: boolean;
  /** How wide the names' column is on tablet and desktop: 168, 200 or 220 of the board. */
  nameWidth?: "s" | "m" | "l";
  /** A line under the rows, in the caption type: "R2010 · metres · x east, y north". */
  caption?: string;
  /** What the rows are, for the tests. */
  testId: string;
};

// The board "Handover, previews": a row of 28 with a line under it, the name at the left in a column of its own, what it is
// in words in text-2. On phone the words take the next line: the name is as long as "Positions not used (152)".
const ROW = classNames("flex min-h-7 flex-col gap-0.5 border-b border-line-subtle py-1", "tablet:flex-row tablet:items-baseline tablet:gap-3 tablet:py-0");
const NAME_WIDTH = { s: "tablet:w-42", m: "tablet:w-50", l: "tablet:w-55" } as const;

/**
 * Rows of a name and what it is, under a section's title (the board "Handover, previews": the layers of the DXF, what is in
 * the KMZ and what is not, the columns of the CSV). A description list: the names are the terms.
 */
export function FactRows({ title, rows, mono = false, nameWidth = "s", caption, testId }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <h3 className="type-section text-text-3">{title}</h3>
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div key={row.name} data-testid={testId} className={ROW}>
            <dt className={classNames("shrink-0", NAME_WIDTH[nameWidth], mono ? "type-value-small" : "type-small tablet:type-body")}>{row.name}</dt>
            <dd className="min-w-0 type-small text-text-2 tablet:type-body">{row.words}</dd>
          </div>
        ))}
      </dl>
      {caption ? <p className="type-caption text-text-2">{caption}</p> : null}
    </div>
  );
}
