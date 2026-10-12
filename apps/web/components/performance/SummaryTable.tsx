import { useId } from "react";
import { classNames } from "@/components/ui/class-names";
import { Table } from "@/components/ui/Table";
import { SUMMARY_COLUMNS, type SummaryRowView } from "@/lib/performance/summary";

type Props = {
  rows: readonly SummaryRowView[];
  /** The rows are of before, and a new run is on its way: they stay, dimmed. */
  isDimmed: boolean;
};

/** The summary of the chosen option in the engine's words, under All 21 steps (V2 · 8): a table; cards on phone. */
export function SummaryTable({ rows, isDimmed }: Props) {
  const heading = useId();
  return (
    <section data-testid="summary-table" aria-labelledby={heading} className="flex flex-col gap-2.5">
      <h3 id={heading} className="type-body-touch desktop:type-body text-text-2">
        The summary, as in the report
      </h3>
      <Table caption="The design, summed up as in the report" columns={SUMMARY_COLUMNS} rows={rows} keyOf={(row) => row.key} className={classNames(isDimmed && "opacity-updating")} />
    </section>
  );
}
