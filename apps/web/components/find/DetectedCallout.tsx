import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { measures } from "@/components/ui/measures";
import { shown } from "@/components/ui/number-entry";
import { FOOTPRINTS_QUANTISED_M } from "@/lib/map/overture";
import type { Detected } from "./OutlineLayer";

type Props = {
  detected: Detected;
  /** The footprint is taken; its corners drag as any closed roof's (the callout says so). */
  onUse: () => void;
  onClose: () => void;
};

// A callout on the stage (docs/design/components.md, "Callout on the stage"), placed at the press.
const CALLOUT = classNames(
  "placed z-stage-overlay flex w-85 max-w-full flex-col gap-2 rounded-row border border-note-line bg-surface-1 px-3.5 py-2.5 shadow-float",
  "translate-x-4 translate-y-4",
);
const CALLOUT_GAP = 16;

/** What a press with Detect building found: a footprint to use, its corners to drag after, or nothing known here. */
export function DetectedCallout({ detected, onUse, onClose }: Props) {
  return (
    <div role="status" data-testid="detected" className={CALLOUT} style={measures({ x: detected.at.x + CALLOUT_GAP, y: detected.at.y + CALLOUT_GAP })}>
      <div className="flex items-start gap-2">
        <span className="grow type-body-touch desktop:type-body font-medium">
          {detected.found ? `Footprint found · ${detected.corners} corners · ${shown(Math.round(detected.area), 0)} m²` : "No footprint known here"}
        </span>
        <IconButton label="Close" icon="close" iconSize={14} kind="quiet" size="xs" onClick={onClose} className="-mt-1 -mr-1" />
      </div>
      <span className="type-body-touch desktop:type-body text-text-2">
        {detected.found
          ? `From Overture Maps, accurate to about ${shown(FOOTPRINTS_QUANTISED_M, 1)} m. Use it, or drag its corners to the roof's edge.`
          : "Outline the roof by corners or by a rectangle instead."}
      </span>
      {detected.found ? (
        <div className="flex gap-2">
          <Button kind="primary" size="s" onClick={onUse}>
            Use this outline
          </Button>
        </div>
      ) : null}
    </div>
  );
}
