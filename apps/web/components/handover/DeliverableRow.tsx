import Link from "next/link";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Deliverable } from "@/lib/handover/items";
import { pathOfItem } from "@/lib/routes";

/**
 * Whether the row's item is open: at its own address (`here`: the row says so, `aria-current`), or shown beside the list
 * at the list's own address on desktop and tablet (`beside`: the row looks open there, and on phone, where the list
 * stands alone, like the others).
 */
export type Open = "no" | "here" | "beside";

type Props = {
  row: Deliverable;
  open: Open;
  /** The item's file is on its way: a turning ring stands in the icon's place (plan/phase-09-plan.md, decision 12). */
  isOnItsWay?: boolean;
};

// The board's row of 64 (components.md, "Deliverable row"): the badge of 44 by 28, the name, a line of facts, then a
// download icon for a file or a chevron for a view; on phone every row has the chevron, since every row opens a screen.
const ROW = classNames(
  "flex min-h-16 items-center gap-3.5 rounded-card-s border px-3.5 text-left select-none",
  "press-motion focus-ring hovered:bg-surface-2",
);
const OPEN: Record<Open, string> = {
  no: "border-transparent bg-transparent",
  here: "border-note-line bg-surface-2",
  beside: "border-transparent bg-transparent tablet:border-note-line tablet:bg-surface-2",
};
const BADGE = "flex h-7 w-11 shrink-0 items-center justify-center rounded-xs type-tick font-medium";
const BADGE_OPEN: Record<Open, string> = {
  no: "bg-control-active",
  here: "bg-accent text-accent-ink",
  beside: "bg-control-active tablet:bg-accent tablet:text-accent-ink",
};
const ICON: Record<Open, string> = { no: "text-text-3", here: "text-text", beside: "text-text-3 tablet:text-text" };

export function DeliverableRow({ row, open, isOnItsWay = false }: Props) {
  // Before options the download icon is dim: the file cannot be made. The words and the badge stay as they are, since the
  // row is a link that works and its facts say what is missing (dimmed text would fall under the contrast asked); at the
  // first load the skeleton says it instead.
  const isDim = row.waits && row.facts !== null;
  return (
    <Link href={pathOfItem(row.id)} aria-current={open === "here" ? "page" : undefined} data-testid="deliverable" className={classNames(ROW, OPEN[open])}>
      <span aria-hidden="true" className={classNames(BADGE, BADGE_OPEN[open])}>
        {row.badge}
      </span>
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="font-medium">{row.name}</span>
        {row.facts === null ? (
          <Skeleton kind="text" className="my-1 w-44" />
        ) : (
          <span data-testid="deliverable-facts" className="type-caption text-text-2">
            {row.facts}
          </span>
        )}
      </span>
      <span className={classNames("flex shrink-0", ICON[open], isDim && "opacity-disabled")}>
        {isOnItsWay ? (
          <ProgressRing size={16} label="On its way" />
        ) : (
          <>
            <Icon name="chevron-right" size={18} className={row.opens === "file" ? "tablet:hidden" : undefined} />
            {row.opens === "file" ? <Icon name="download" size={18} className="hidden tablet:block" /> : null}
          </>
        )}
      </span>
    </Link>
  );
}
