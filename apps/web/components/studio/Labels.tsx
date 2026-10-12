"use client";

import { useLayoutEffect, useReducer, useRef, type RefObject } from "react";
import { useStore } from "zustand";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { centredBoxOf, chipBoxOf, clearOf, type Size } from "@/lib/scene/chip-place";
import type { StageLabel } from "@/lib/scene/projection";
import { labelsOf, type StageStore } from "@/lib/scene/stage-store";
import { useSize } from "./use-size";

type Props = { stage: StageStore };

// The look of the map's edge labels (components/find/OutlineLayer.tsx), in text-2 as the boards draw them
// on the stage; on phone in the size of a tick. Each is centred on the point it is anchored to.
const LABEL = classNames(
  "placed block -translate-x-1/2 -translate-y-1/2 rounded-control bg-ground px-2.25 py-0.75 font-medium text-text-2 shadow-tooltip select-none",
  "type-unit tablet:type-body",
);

// The chip of an inverter (plan/phase-07-plan.md, decision 13; the board "Strings on the roof"): "INV-1" in the
// accent, its foot 4 over the top of its box on the roof, centred on where the Projector says the top falls.
const CHIP = "absolute bottom-1 left-0 block -translate-x-1/2 rounded-control bg-accent px-2 type-unit font-medium whitespace-nowrap text-accent-ink shadow-tooltip select-none";

/** What was measured of a label or a chip: its size, and how far its foot stands over its point (0 for a label, centred on it). */
type Measured = Size & { foot: number };

/**
 * The sizes of the labels and the chips, measured once each by their words and the screen's size (the type changes
 * with it): the projection moves them every frame, their size does not. An element whose size is not known yet is
 * measured after its first render, in its own place, and the layer is drawn once more with what was measured.
 */
function useMeasured(layer: RefObject<HTMLDivElement | null>) {
  const [, measured] = useReducer((count: number) => count + 1, 0);
  const sizes = useRef(new Map<string, Measured>());
  const waiting = useRef(new Map<string, { element: HTMLElement; y: number }>());

  useLayoutEffect(() => {
    const box = layer.current?.getBoundingClientRect();
    if (!box || waiting.current.size === 0) return;
    for (const [key, { element, y }] of waiting.current) {
      const rect = element.getBoundingClientRect();
      sizes.current.set(key, { width: rect.width, height: rect.height, foot: y - (rect.bottom - box.top) });
    }
    waiting.current.clear();
    measured();
  });

  return {
    sizeOf: (key: string): Measured | null => sizes.current.get(key) ?? null,
    /** The ref of an element whose size is wanted; `y` is the point it stands over, for its foot. */
    measure:
      (key: string, y: number) =>
      (element: HTMLElement | null): void => {
        if (element && !sizes.current.has(key)) waiting.current.set(key, { element, y });
      },
  };
}

/**
 * The dimension labels of the roof and the chips of the inverters, as DOM over the stage (plan decision 6):
 * each placed where the Projector says its point of the scene falls, hidden while it is behind the camera.
 * A chip that the projection puts over an edge label moves off it by the smallest shift (lib/scene/chip-place.ts):
 * on phone the demo's "INV-1" would stand over its "90.0 m". They are for the eye: the text equivalent of the
 * scene says the roof and the inverters in words. The layer holds them in place (a placed thing stands in its
 * nearest layout container) and clips what falls outside the canvas.
 */
export function Labels({ stage }: Props) {
  const labels = useStore(stage, labelsOf);
  const layer = useRef<HTMLDivElement>(null);
  const screen = useSize();
  const { sizeOf, measure } = useMeasured(layer);
  const keyOf = (label: StageLabel) => `${screen}:${label.kind}:${label.words}`;
  const edges = labels.filter((label) => label.visible && label.kind === "label");
  const chips = labels.filter((label) => label.visible && label.kind === "inverter");
  const edgeBoxes = edges.flatMap((label) => {
    const size = sizeOf(keyOf(label));
    return size ? [centredBoxOf([label.x, label.y], size)] : [];
  });

  return (
    <div ref={layer} aria-hidden="true" className="pointer-events-none absolute inset-0 z-stage-overlay overflow-hidden contain-layout">
      {edges.map((label, index) => (
        <span key={`label-${index}`} ref={measure(keyOf(label), label.y)} data-testid="stage-label" className={LABEL} style={measures({ x: label.x, y: label.y })}>
          {label.words}
        </span>
      ))}
      {chips.map((label, index) => {
        const size = sizeOf(keyOf(label));
        const [dx, dy] = size ? clearOf(chipBoxOf([label.x, label.y], size, size.foot), edgeBoxes) : [0, 0];
        return (
          <span key={`chip-${index}`} className="placed size-0" style={measures({ x: label.x + dx, y: label.y + dy })}>
            <span ref={measure(keyOf(label), label.y)} data-testid="inverter-chip" className={CHIP}>
              {label.words}
            </span>
          </span>
        );
      })}
    </div>
  );
}
