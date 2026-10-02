"use client";

import { useStore } from "zustand";
import { measures } from "@/components/ui/measures";
import { labelsOf, type StageStore } from "@/lib/scene/stage-store";

type Props = { stage: StageStore };

/**
 * The chips of the chosen option's inverters over their boxes on the roof (plan/phase-07-plan.md, decision 13; the
 * board "Strings on the roof"): "INV-1" in the accent, its foot 4 over the box's top, placed where the Projector
 * says the top falls. For the eye: the text equivalent says the inverters in words.
 */
export function InverterChips({ stage }: Props) {
  const labels = useStore(stage, labelsOf);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-stage-overlay overflow-hidden contain-layout">
      {labels.map((label, index) =>
        label.visible && label.kind === "inverter" ? (
          <span key={index} className="placed size-0" style={measures({ x: label.x, y: label.y })}>
            <span
              data-testid="inverter-chip"
              className="absolute bottom-1 left-0 block -translate-x-1/2 rounded-xs bg-accent px-2 type-tick font-medium whitespace-nowrap text-accent-ink shadow-tooltip select-none"
            >
              {label.words}
            </span>
          </span>
        ) : null,
      )}
    </div>
  );
}
