import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DownloadStatus } from "@/lib/stores/downloads-store";
import type { Deliverable } from "@/lib/flow/deliverables/items";
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
  /** Save a copy of the project file was pressed: the .rtd is downloaded (plan/phase-09-plan.md, step 8). */
  onSaveACopy: () => void;
  /** The state of Download all: the zip on its way, or not. */
  all: DownloadStatus;
  /** Download all was pressed: the zip of everything is downloaded (plan/phase-09-plan.md, step 21, decision 10). */
  onDownloadAll: () => void;
  /** The note of a run that failed, under the head on phone, where the list is the whole page (D93); on tablet and desktop the preview beside holds it. */
  note?: ReactNode;
};

const PROJECT_FILE: HandoverItem = "project-file";
const ON_ITS_WAY = "on-its-way";

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

/**
 * The list of what is delivered: the head with Download all, the rows, the project file. Download all is the zip of the
 * files, each named as its own download (decision 10): it needs a chosen option as the five files do, and is dim with their
 * rows before one; on its way it shows the ring and is dim without its shadow.
 */
export function DeliverableList({ rows, item, shown, downloads, onSaveACopy, all, onDownloadAll, note = null }: Props) {
  const projectFile = rows.find((row) => row.id === PROJECT_FILE) ?? null;
  const isProjectFileOnItsWay = downloads[PROJECT_FILE]?.status === ON_ITS_WAY;
  const canSave = projectFile !== null && !projectFile.waits && !isProjectFileOnItsWay;
  const files = rows.filter((row) => row.kind !== null);
  const isAllOnItsWay = all.status === ON_ITS_WAY;
  // The zip holds the files of the design: it can be made once they can, which the rows of the design say.
  const canDownloadAll = files.some((row) => row.id !== PROJECT_FILE && !row.waits);
  const zipFacts = `${files.length} files · one zip`;

  return (
    <>
      <div className={HEAD}>
        <div className="flex flex-col gap-1">
          <h1 className="type-lens-touch tablet:type-page">Handover</h1>
          <p className="type-small text-text-2 tablet:type-body-touch desktop:type-body">Everything the installer, the client and the utility need</p>
        </div>
        <div data-testid="download-all" className={DOWNLOAD_ALL}>
          <Button
            icon={isAllOnItsWay ? undefined : "download"}
            aria-disabled={canDownloadAll && !isAllOnItsWay ? undefined : "true"}
            onClick={canDownloadAll && !isAllOnItsWay ? onDownloadAll : undefined}
            className="w-full tablet:w-auto"
          >
            {isAllOnItsWay ? <ProgressRing size={16} /> : null}
            Download all
          </Button>
          <span className="type-caption text-text-2">{zipFacts}</span>
        </div>
      </div>
      {note ? <div className="tablet:hidden">{note}</div> : null}
      <ul data-testid="deliverables" className="flex flex-col gap-1.5">
        {rows
          .filter((row) => row.id !== PROJECT_FILE)
          .map((row) => (
            <li key={row.id}>
              <DeliverableRow row={row} open={openOf(row, item, shown)} isOnItsWay={downloads[row.id]?.status === ON_ITS_WAY} />
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
          <Button onClick={canSave ? onSaveACopy : undefined} aria-disabled={canSave ? undefined : "true"} className="w-full tablet:w-auto">
            {isProjectFileOnItsWay ? <ProgressRing size={16} /> : null}
            Save a copy
          </Button>
        </div>
      ) : null}
    </>
  );
}
