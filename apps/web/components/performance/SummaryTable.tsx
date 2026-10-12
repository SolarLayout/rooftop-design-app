import { useId } from "react";
import { classNames } from "@/components/ui/class-names";
import { Table } from "@/components/ui/Table";
import { SUMMARY_COLUMNS, type SummaryRowView } from "@/lib/performance/summary";

type Props = {
  rows: readonly SummaryRowView[];
  /** The rows are of before, and a new run is on its way: they stay, dimmed. */
  isDimmed: boolean;
};

const CARD = "flex flex-col gap-2.5 rounded-card border border-line bg-surface-1 p-4 shadow-card tablet:px-6 tablet:py-5.5";

/** The summary of the chosen option in the engine's words (the board "Performance"): a table; cards on phone. */
export function SummaryTable({ rows, isDimmed }: Props) {
  const heading = useId();
  return (
    <section data-testid="summary-table" aria-labelledby={heading} className={CARD}>
      <h2 id={heading} className="type-section">
        Summary
      </h2>
      <Table caption="The design, summed up by the engine" columns={SUMMARY_COLUMNS} rows={rows} keyOf={(row) => row.key} className={classNames(isDimmed && "opacity-updating")} />
    </section>
  );
}
