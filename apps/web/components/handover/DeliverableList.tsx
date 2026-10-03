import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import type { DownloadStatus } from "@/lib/handover/downloads-store";
import type { Deliverable } from "@/lib/handover/items";
import type { HandoverItem } from "@/lib/routes";
import { DeliverableRow, type Open } from "./DeliverableRow";

type Props = {
  rows: Deliverable[];
  /** The item that is open, at its own address; null at the list's own address. */
  item: HandoverItem | null;
  /** The item shown beside the list on desktop and tablet: the open one, or the first. */
  shown: HandoverItem;
  /** The state of each item's download; an item not named is at rest. */
  downloads: Partial<Record<HandoverItem, DownloadStatus>>;
  /** Save a copy of the project file was pressed. Without it the press is shown and cannot be used. */
  onSaveACopy?: () => void;
};

/** Download all comes with the zip (plan/phase-09-plan.md, pull request 4): until then it is shown and cannot be used. */
export const WHY_NOT_DOWNLOAD_ALL = "Comes with the zip";

const PROJECT_FILE: HandoverItem = "project-file";

// The head: the title with its line under it; Download all with its facts at the right on desktop, in a row under the
// title on tablet, across the width on phone.
const HEAD = "flex flex-col gap-3 tablet:gap-3.5 desktop:flex-row desktop:items-start desktop:gap-4";
const DOWNLOAD_ALL = "flex flex-col gap-1 tablet:flex-row tablet:items-center tablet:gap-3 desktop:ml-auto desktop:flex-col desktop:items-end desktop:gap-1";

// The project file as the card at the end of the list: at the bottom on desktop, across the width with its press under
// its words on phone.
const CARD = classNames(
  "flex flex-col gap-3.5 rounded-card-s border border-line bg-surface-1 p-4 shadow-card",
  "tablet:flex-row tablet:items-center desktop:mt-auto",
);

function openOf(row: Deliverable, item: HandoverItem | null, shown: HandoverItem): Open {
  if (row.id !== shown) return "no";
  return item === null ? "beside" : "here";
}

/** The list of what is delivered: the head, the rows, the project file. */
export function DeliverableList({ rows, item, shown, downloads, onSaveACopy }: Props) {
  const projectFile = rows.find((row) => row.id === PROJECT_FILE) ?? null;

  return (
    <>
      <div className={HEAD}>
        <div className="flex flex-col gap-1">
          <h1 className="type-lens-touch tablet:type-page">Handover</h1>
          <p className="type-small text-text-2 tablet:type-body-touch desktop:type-body">Everything the installer, the client and the utility need</p>
        </div>
        <div className={DOWNLOAD_ALL}>
          <Tooltip words={WHY_NOT_DOWNLOAD_ALL} className="w-full tablet:w-auto">
            <Button icon="download" aria-disabled="true" className="w-full tablet:w-auto">
              Download all
            </Button>
          </Tooltip>
          <span className="type-caption text-text-2">6 files · one zip</span>
        </div>
      </div>
      <ul data-testid="deliverables" className="flex flex-col gap-1.5">
        {rows
          .filter((row) => row.id !== PROJECT_FILE)
          .map((row) => (
            <li key={row.id}>
              <DeliverableRow row={row} open={openOf(row, item, shown)} isOnItsWay={downloads[row.id]?.status === "on-its-way"} />
            </li>
          ))}
      </ul>
      {projectFile ? (
        <div data-testid="project-file-card" className={CARD}>
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span className="font-medium">{projectFile.name}</span>
            {projectFile.facts === null ? (
              <Skeleton kind="text" className="my-1 w-44" />
            ) : (
              <span data-testid="deliverable-facts" className="type-caption text-text-2">
                {projectFile.facts}
              </span>
            )}
          </div>
          <Button onClick={onSaveACopy} aria-disabled={onSaveACopy === undefined || projectFile.waits ? "true" : undefined} className="w-full tablet:w-auto">
            Save a copy
          </Button>
        </div>
      ) : null}
    </>
  );
}
