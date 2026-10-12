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
 * The files of Handover by who they are for (V2 · 9, D105; the board "V2 · 9 · Handover and Home"): For the client, For
 * the utility, For the installer, For you, each group's title in text-2 over its rows, 24 between the groups.
 */
export function DeliverableList({ rows, item, shown, downloads, onDownload, note = null }: Props) {
  return (
    <>
      {note ? <div className="tablet:hidden">{note}</div> : null}
      <div data-testid="deliverables" className="flex flex-col gap-6">
        {groupsOf(rows).map((group) => (
          <section key={group.title} aria-label={group.title} className="flex flex-col gap-1">
            <h3 className="px-3 type-strong-touch desktop:type-strong text-text-2">{group.title}</h3>
            <ul className="flex flex-col gap-1">
              {group.rows.map((row) => (
                <li key={row.id}>
                  <DeliverableRow row={row} open={openOf(row, item, shown)} isOnItsWay={downloads[row.id]?.status === ON_ITS_WAY} onDownload={() => onDownload(row.id)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
