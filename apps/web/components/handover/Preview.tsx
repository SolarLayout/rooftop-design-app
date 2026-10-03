import type { ReactNode } from "react";
import { NoOptionsCard } from "@/components/performance/NoOptionsCard";
import { FailedRow } from "@/components/performance/UnderTheTitle";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Deliverable } from "@/lib/handover/items";
import type { PageView } from "@/lib/handover/page-view";

type Props = {
  /** The item that is shown. */
  row: Deliverable;
  view: PageView;
  onTryAgain: () => void;
  /** The primary action of the head was pressed. Without it the press is shown and cannot be used. */
  onAction?: () => void;
  /** The body of the item. It stands unless the item waits for a decision, or nothing was ever there. */
  children: ReactNode;
};

const HEAD = "flex items-center gap-3";
const FACTS = "type-caption text-text-2";

/**
 * The frame of an item's preview (the boards "Handover" on three sizes and "Handover, states"): the head with the item's
 * name, its facts and its primary action, 44 square with the icon alone on phone; under it a run that failed with Try
 * again; then the body, or before options the API's words leading to the Strings lens, or at the first load a skeleton.
 */
export function Preview({ row, view, onTryAgain, onAction, children }: Props) {
  const canAct = onAction !== undefined && !row.waits && view.kind !== "loading";

  return (
    <>
      <div className={HEAD}>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h2 className="type-lens-touch tablet:type-title">{row.name}</h2>
          {row.facts === null ? (
            <Skeleton kind="text" className="my-1 w-44" />
          ) : (
            <span data-testid="preview-facts" className={classNames(FACTS, view.isDimmed && "opacity-updating")}>
              {row.facts}
            </span>
          )}
        </div>
        {row.action ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex tablet:hidden">
              <IconButton kind="primary" size="l" icon="download" label={row.action} aria-disabled={canAct ? undefined : "true"} onClick={canAct ? onAction : undefined} />
            </span>
            <span className="hidden tablet:flex">
              <Button kind="primary" icon="download" aria-disabled={canAct ? undefined : "true"} onClick={canAct ? onAction : undefined}>
                {row.action}
              </Button>
            </span>
          </div>
        ) : null}
      </div>
      {view.failed ? <FailedRow failed={view.failed} onTryAgain={onTryAgain} /> : null}
      {view.decision && row.waits ? (
        <NoOptionsCard decision={view.decision} testId="files-wait" />
      ) : view.kind === "loading" && row.waits ? (
        <div data-testid="preview-skeleton" aria-hidden="true" className="h-80 w-full rounded-xs bg-surface-2 breathing tablet:h-96" />
      ) : (
        children
      )}
    </>
  );
}
