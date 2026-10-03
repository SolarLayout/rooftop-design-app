import { classNames } from "@/components/ui/class-names";
import { Table } from "@/components/ui/Table";
import type { Sort } from "@/components/ui/table-sort";
import { IN_THE_REPORT } from "@/lib/handover/in-the-report";
import type { ScheduleView } from "@/lib/handover/schedule-view";
import { TABLE_PANEL } from "./BillOfMaterials";

type Props = {
  view: ScheduleView;
  sort: Sort | null;
  onSort: (sort: Sort | null) => void;
  /** The run is of before, and a new one is on its way: the table stays, dimmed. */
  isDimmed?: boolean;
};

/**
 * The DC cable schedule of the chosen option (the board "Handover, previews"; plan/phase-09-plan.md, step 16): a Table of
 * every string with the engine's eight columns, its heads sorting, the total row last; on phone each string a card, the
 * total one more card, with "In the report, page 5" over them.
 */
export function CableSchedule({ view, sort, onSort, isDimmed = false }: Props) {
  return (
    <div data-testid="cable-schedule" className={classNames("flex flex-col gap-2.5", isDimmed && "opacity-updating")}>
      <span className="type-caption text-text-2 tablet:hidden">{IN_THE_REPORT}</span>
      <Table caption={view.caption} columns={view.columns} rows={view.rows} keyOf={view.keyOf} total={view.total} sort={sort} onSort={onSort} className={TABLE_PANEL} />
    </div>
  );
}
