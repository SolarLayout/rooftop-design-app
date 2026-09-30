"use client";

import { useStore } from "zustand";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { labelsOf, type StageStore } from "@/lib/scene/stage-store";

type Props = { stage: StageStore };

// The look of the map's edge labels (components/find/OutlineLayer.tsx), in text-2 as the boards draw them
// on the stage; on phone in the size of a tick. Each is centred on the point it is anchored to.
const LABEL = classNames(
  "placed block -translate-x-1/2 -translate-y-1/2 rounded-seg bg-ground px-2.25 py-0.75 font-medium text-text-2 shadow-tooltip select-none",
  "type-tick tablet:type-value-small",
);

/**
 * The dimension labels of the roof, as DOM over the stage (plan decision 6): each placed where the
 * Projector says its point of the scene falls, hidden while it is behind the camera. They are for the
 * eye: the text equivalent of the scene says the roof in words. The layer holds them in place (a placed
 * thing stands in its nearest layout container) and clips what falls outside the canvas.
 */
export function Labels({ stage }: Props) {
  const labels = useStore(stage, labelsOf);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-stage-overlay overflow-hidden contain-layout">
      {labels.map((label, index) =>
        label.visible ? (
          <span key={index} data-testid="stage-label" className={LABEL} style={measures({ x: label.x, y: label.y })}>
            {label.words}
          </span>
        ) : null,
      )}
    </div>
  );
}
