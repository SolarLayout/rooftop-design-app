import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { measures } from "@/components/ui/measures";
import { shown } from "@/components/ui/number-entry";
import { FOOTPRINTS_QUANTISED_M } from "@/lib/map/overture";
import type { Detected } from "./OutlineLayer";

type Props = {
  detected: Detected;
  /** The footprint was taken as the outline by the press: Undo takes it back (issue 238, item 5). */
  onUndo: () => void;
  /** The note closes; the footprint stays, its corners to drag as any closed roof's. */
  onClose: () => void;
};

// A callout on the stage (docs/design/components.md, "Callout on the stage"), placed at the press.
const CALLOUT = classNames(
  "placed z-stage-overlay flex w-85 max-w-full flex-col gap-2 rounded-row border border-note-line bg-surface-1 px-3.5 py-2.5 shadow-float",
  "translate-x-4 translate-y-4",
);
const CALLOUT_GAP = 16;

/**
 * What a press with Detect building found: a footprint, taken as the roof's outline by the press, its corners to drag
 * after, and Undo to take it back (as voice §5 has a note of what the app did); or nothing known here.
 */
export function DetectedCallout({ detected, onUndo, onClose }: Props) {
  return (
    <div role="status" data-testid="detected" className={CALLOUT} style={measures({ x: detected.at.x + CALLOUT_GAP, y: detected.at.y + CALLOUT_GAP })}>
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
