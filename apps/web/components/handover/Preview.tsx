import type { ReactNode } from "react";
import { NoOptionsCard } from "@/components/shell/NoOptionsCard";
import { FailedRow } from "@/components/shell/UnderTheTitle";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Deliverable } from "@/lib/flow/deliverables/items";
import type { PageView } from "@/lib/handover/page-view";

type Props = {
  /** The item that is shown. */
  row: Deliverable;
  view: PageView;
  onTryAgain: () => void;
  /** The primary action of the head was pressed. Without it the press is shown and cannot be used. */
  onAction?: () => void;
  /** The item's file is on its way: the press is dim without its shadow, with a turning ring before its words. */
  isOnItsWay?: boolean;
  /** The body's own actions, before the primary one, on tablet and desktop: the report's previous and next. On phone the body holds them. */
  actions?: ReactNode;
  /** The body's words in the facts' place, on tablet and desktop: the report's "Page 1 of 6 · Summary". On phone the body holds them. */
  words?: string | null;
  /** What stands in the body's place at the first load: the breathing block, unless the body has a skeleton of its own shape. */
  skeleton?: ReactNode;
  /** The actions of an item that is a view, in the primary action\'s place on every size: "In the report, page 5" and Copy as table. */
  tools?: ReactNode;
  /** The body of the item. It stands unless the item waits for a decision, or nothing was ever there. */
  children: ReactNode;
};

const HEAD = "flex items-center gap-3";
const FACTS = "type-caption text-text-2";

/**
 * The frame of an item's preview (the boards "Handover" on three sizes and "Handover, states"): the head with the item's
 * name, its facts and its primary action, 44 square with the icon alone on phone (or the tools of a view: the tables);
 * under it a run that failed with Try again; then the body, or before options the API's words leading to the Strings lens, or at the first load a skeleton.
 */
export function Preview({ row, view, onTryAgain, onAction, isOnItsWay = false, actions, words, skeleton, tools, children }: Props) {
  const canAct = onAction !== undefined && !row.waits && view.kind !== "loading" && !isOnItsWay;
  const disabled = canAct ? undefined : "true";

  return (
    <>
      <div className={HEAD}>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h2 className="type-lens-touch tablet:type-title">{row.name}</h2>
          {row.about === null ? (
            <Skeleton kind="text" className="my-1 w-44" />
          ) : (
            // The body's words stand in the facts' place on tablet and desktop, as the board draws the head ("Page 1 of 6 ·
            // Summary"); the facts stay in the row of the list, and on phone in the head, where the body's row holds the words.
            <span className={FACTS}>
              <span data-testid="preview-facts" className={classNames(view.isDimmed && "opacity-updating", words && "tablet:hidden")}>
                {row.about}
              </span>
              {words ? (
                <span data-testid="page-words" className="hidden tablet:inline">
                  {words}
                </span>
              ) : null}
            </span>
          )}
        </div>
        {actions ? <div className="hidden shrink-0 items-center gap-2 tablet:flex">{actions}</div> : null}
        {row.action ? (
          <div data-testid="preview-action" className="flex shrink-0 items-center gap-2">
            <span className="flex tablet:hidden">
              {isOnItsWay ? (
                <Button kind="primary" size="l" aria-label={row.action} aria-disabled="true" className="w-touch px-0">
                  <ProgressRing size={16} />
                </Button>
              ) : (
                <IconButton kind="primary" size="l" icon="download" label={row.action} aria-disabled={disabled} onClick={canAct ? onAction : undefined} />
              )}
            </span>
            <span className="hidden tablet:flex">
              <Button kind="primary" icon={isOnItsWay ? undefined : "download"} aria-disabled={disabled} onClick={canAct ? onAction : undefined}>
                {isOnItsWay ? <ProgressRing size={16} /> : null}
                {row.action}
              </Button>
            </span>
          </div>
        ) : tools ? (
          <div data-testid="preview-action" className="flex shrink-0 items-center gap-2">
            {tools}
          </div>
        ) : null}
      </div>
      {view.failed ? <FailedRow failed={view.failed} onTryAgain={onTryAgain} /> : null}
      {view.decision && row.waits ? (
        <NoOptionsCard decision={view.decision} testId="files-wait" />
      ) : view.kind === "loading" && row.waits ? (
        (skeleton ?? <div data-testid="preview-skeleton" aria-hidden="true" className="h-80 w-full rounded-xs bg-surface-2 breathing tablet:h-96" />)
      ) : (
        children
      )}
    </>
  );
}
