import type { ReactNode } from "react";
import { groupsOf, type Deliverable } from "@/lib/flow/deliverables/items";
import type { DownloadStatus } from "@/lib/stores/downloads-store";
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
  onDownload: (item: HandoverItem) => void;
  /** The note of a run that failed, over the list on phone, where the list is the whole page (D93). */
  note?: ReactNode;
};

const ON_ITS_WAY = "on-its-way";

function openOf(row: Deliverable, item: HandoverItem | null, shown: HandoverItem): Open {
  if (row.id !== shown) return "no";
  return item === null ? "beside" : "here";
}

/**
 * The files of Handover in the order of who they are for (V2 · 9, D105): the client's, the utility's, the installer's,
 * yours. One list without the groups' titles (the owner, 2026-10-13: "remove the superfluous labels"), so that its first
 * row starts at the preview card's top edge on desktop.
 */
export function DeliverableList({ rows, item, shown, downloads, onDownload, note = null }: Props) {
  return (
    <>
      {note ? <div className="tablet:hidden">{note}</div> : null}
      <ul data-testid="deliverables" aria-label="Files" className="flex flex-col gap-1">
        {groupsOf(rows)
          .flatMap((group) => group.rows)
          .map((row) => (
            <li key={row.id}>
              <DeliverableRow row={row} open={openOf(row, item, shown)} isOnItsWay={downloads[row.id]?.status === ON_ITS_WAY} onDownload={() => onDownload(row.id)} />
            </li>
          ))}
      </ul>
    </>
  );
}
