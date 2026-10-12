import Link from "next/link";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Deliverable } from "@/lib/flow/deliverables/items";
import { pathOfItem } from "@/lib/routes";

/**
 * Whether the row's item is open: at its own address (`here`: the row says so, `aria-current`), or shown beside the list
 * at the list's own address on desktop (`beside`: the row looks open there, and on touch, where the list
 * stands alone, like the others).
 */
export type Open = "no" | "here" | "beside";

type Props = {
  row: Deliverable;
  open: Open;
  /** The item's file is on its way: a turning ring stands in the Download's place (plan/phase-09-plan.md, decision 12). */
  isOnItsWay?: boolean;
  /** Download was pressed; the press cannot be used while the item waits. */
  onDownload: () => void;
};

// The board's row (V2 · 9, D105): 60 high, 64 on touch, its name and what it is with its size, then its format alone as a
// badge and its own Download. The row opens the file's preview; the Download beside it saves the file.
const ROW = classNames(
  "flex min-h-16 min-w-0 grow flex-col justify-center gap-0.5 rounded-row border px-3 py-2 text-left select-none",
  "press-motion focus-ring hovered:bg-surface-2 desktop:min-h-15",
);
const OPEN: Record<Open, string> = {
  no: "border-transparent bg-transparent",
  here: "border-line-strong bg-surface-2",
  beside: "border-transparent bg-transparent desktop:border-line-strong desktop:bg-surface-2",
};
const BADGE = "rounded-swatch border border-line px-1.5 py-0.5 type-unit text-text-2";

export function DeliverableRow({ row, open, isOnItsWay = false, onDownload }: Props) {
  // Before options the Download cannot be used: the file cannot be made. The words stay as they are, since the row is a link
  // that works and its line says what is missing; at the first load the skeleton says it instead.
  const canDownload = !row.waits && !isOnItsWay;
  return (
    <div data-testid="deliverable-row" className="relative flex items-center gap-3">
      <Link href={pathOfItem(row.id)} aria-current={open === "here" ? "page" : undefined} data-testid="deliverable" className={classNames(ROW, OPEN[open], "pr-28")}>
        <span className="type-strong-touch desktop:type-strong">{row.name}</span>
        {row.facts === null ? (
          <Skeleton kind="text" className="my-1 w-44" />
        ) : (
          <span data-testid="deliverable-facts" className="type-body-touch desktop:type-body text-text-2">
            {row.facts}
          </span>
        )}
      </Link>
      {/* The badge and the Download stand over the row's right end, apart from the link: a press of Download opens nothing. */}
      <span className="absolute right-2 flex items-center gap-2">
        <span aria-hidden="true" className={BADGE}>
          {row.badge}
        </span>
        {isOnItsWay ? (
          <span className="flex size-10 items-center justify-center">
            <ProgressRing size={16} label="Preparing" />
          </span>
        ) : (
          <IconButton kind="quiet" icon="download" label={`Download ${row.name}`} aria-disabled={canDownload ? undefined : "true"} onClick={canDownload ? onDownload : undefined} />
        )}
      </span>
    </div>
  );
}
