import { classNames } from "@/components/ui/class-names";
import { Table } from "@/components/ui/Table";
import type { BomView } from "@/lib/handover/bom-view";
import { IN_THE_REPORT } from "@/lib/handover/in-the-report";

type Props = {
  view: BomView;
  /** The run is of before, and a new one is on its way: the table stays, dimmed. */
  isDimmed?: boolean;
};

/** The table's box in the preview (V2 · 9): a line around it, as the hourly data's; it scrolls sideways where it must, never the page. */
export const TABLE_PANEL = "overflow-x-auto rounded-row border border-line px-3 pt-1 pb-3 tablet:px-4";

/**
 * The bill of materials of the chosen option (the board "Handover, previews"; plan/phase-09-plan.md, step 15): a Table of
 * the engine's lines, Item, Specification, Qty and Unit; on phone each line a card, with "In the report, page 5" over them
 * (on tablet and desktop it stands in the head, beside Copy as table).
 */
export function BillOfMaterials({ view, isDimmed = false }: Props) {
  return (
    <div data-testid="bom" className={classNames("flex flex-col gap-2.5", isDimmed && "opacity-updating")}>
      <span className="type-body-touch desktop:type-body text-text-2 tablet:hidden">{IN_THE_REPORT}</span>
      <Table caption={view.caption} columns={view.columns} rows={view.rows} keyOf={view.keyOf} className={TABLE_PANEL} />
    </div>
  );
}
