"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { measures } from "@/components/ui/measures";
import { shown } from "@/components/ui/number-entry";
import { useSize } from "@/components/ui/use-size";
import { FOOTPRINTS_QUANTISED_M } from "@/lib/map/overture";
import type { XY } from "@/lib/geometry/measure";
import { footprintNotePlaceOf } from "@/lib/outline/footprint-note";
import type { Detected } from "./OutlineLayer";

type Props = {
  detected: Detected;
  /** The map's visible area, which the note stands in: the press is in its pixels, and it changes with the sheet. */
  stage: RefObject<HTMLDivElement | null>;
  /** The footprint was taken as the outline by the press: Undo takes it back (issue 238, item 5). */
  onUndo: () => void;
  /** The note closes; the footprint stays, its corners to drag as any closed roof's. */
  onClose: () => void;
};

// A callout on the stage (docs/design/components.md, "Callout on the stage"), placed by the press, inside the map.
const CALLOUT = "placed z-stage-overlay flex w-85 max-w-full flex-col gap-2 rounded-row border border-note-line bg-surface-1 px-3.5 py-2.5 shadow-float";

/**
 * What a press with Detect building found: a footprint, taken as the roof's outline by the press, its corners to drag
 * after, and Undo to take it back (as voice §5 has a note of what the app did); or nothing known here. It stands below and
 * to the right of the press, fitted inside the map at every size (issue 238, item 31), unseen until it is placed.
 */
export function DetectedCallout({ detected, stage, onUndo, onClose }: Props) {
  const note = useRef<HTMLDivElement>(null);
  // The stage followed as it changes (a stop of the sheet on a phone), so that the note is placed again.
  const stageSize = useSize(stage);
  const [place, setPlace] = useState<XY | null>(null);
  // After each render: its own size, border and padding in (its words differ between found and not found), and the stage
  // where it is on the screen, as the note floats over the page.
  useLayoutEffect(() => {
    const node = note.current;
    const room = stage.current;
    if (!node || !room) return;
    const { left, top, width, height } = room.getBoundingClientRect();
    const next = footprintNotePlaceOf({ at: detected.at, size: { width: node.offsetWidth, height: node.offsetHeight }, stage: { left, top, width, height } });
    setPlace((was) => (was?.x === next.x && was?.y === next.y ? was : next));
  }, [detected, stage, stageSize]);
  return (
    <div ref={note} role="status" data-testid="detected" className={classNames(CALLOUT, place === null && "invisible")} style={measures(place ?? { x: 0, y: 0 })}>
      <div className="flex items-start gap-2">
        <span className="grow type-body-touch desktop:type-body font-medium">
          {detected.found ? `Footprint found · ${detected.taken.length} corners · ${shown(Math.round(detected.area), 0)} m²` : "No footprint known here"}
        </span>
        <IconButton label="Close" icon="close" iconSize={14} kind="quiet" size="xs" onClick={onClose} className="-mt-1 -mr-1" />
      </div>
      <span className="type-body-touch desktop:type-body text-text-2">
        {detected.found
          ? `Taken as the roof's outline, from Overture Maps, accurate to about ${shown(FOOTPRINTS_QUANTISED_M, 1)} m. Drag its corners to the roof's edge.`
          : "Outline the roof by corners or by a rectangle instead."}
      </span>
      {detected.found ? (
        <div className="flex gap-2">
          <Button size="s" icon="undo" onClick={onUndo}>
            Undo
          </Button>
        </div>
      ) : null}
    </div>
  );
}
