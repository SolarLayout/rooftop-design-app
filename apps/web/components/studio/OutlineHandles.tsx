"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useStore } from "zustand";
import { useProject, useStores, useToasts } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { shown } from "@/components/ui/number-entry";
import type { XY } from "@/lib/geometry/adapter";
import { withCornerMoved } from "@/lib/geometry/outline-edit";
import { frameOf } from "@/lib/scene/building";
import { rayAt } from "@/lib/scene/projection";
import { cameraOf, labelsOf, type StageStore } from "@/lib/scene/stage-store";
import { onTheRoofPlane } from "@/lib/stores/drag";
import { projectOf } from "@/lib/stores/project-store";

const TARGET = "placed pointer-events-auto flex size-touch -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full select-none";
const CORNER = "block size-5.5 rounded-full border-corner-touch border-accent bg-handle-fill shadow-handle desktop:size-4.5 desktop:border-corner";
const LIVE = "placed block -translate-y-1/2 translate-x-5 rounded-control bg-ground px-2.25 py-0.75 type-mono-touch desktop:type-mono font-medium whitespace-nowrap text-text shadow-tooltip select-none";

/** Said when a corner is let go where the outline would cross itself or close to nothing: the roof stays as it was. */
export const OUTLINE_REFUSED = "The outline cannot cross itself. The roof stays as it was.";

type Moving = { index: number; pixel: readonly [number, number]; at: XY };

/**
 * The corners of the roof's outline as handles, in the plan of the Roof step while the outline is edited (V2 · 7, D103; audit
 * V2-59): a drag moves a corner over the roof's plane, the live label says the two edges it joins, and the drop commits the
 * outline as one edit, snapped to 0.1 m. An outline that would cross itself is refused, and the roof stays. Find is for a new
 * roof alone. DOM over the stage, placed where the Projector says the corners fall, as an obstacle's handles are.
 */
export function OutlineHandles({ stage }: { stage: StageStore }) {
  const { project: store } = useStores();
  const toasts = useToasts();
  const project = useProject(projectOf);
  const labels = useStore(stage, labelsOf);
  const camera = useStore(stage, cameraOf);
  const layer = useRef<HTMLDivElement>(null);
  const [moving, setMoving] = useState<Moving | null>(null);
  const corners = labels.filter((label) => label.kind === "handle" && label.id?.startsWith("outline-") && label.visible);
  if (!project || corners.length === 0) return null;
  const { roof } = project;

  function pointOf(event: PointerEvent): { pixel: readonly [number, number]; at: XY } | null {
    const box = layer.current?.getBoundingClientRect();
    if (!box || !camera) return null;
    const pixel = [event.clientX - box.left, event.clientY - box.top] as const;
    const { centroid, heightAt } = frameOf(roof);
    const hit = onTheRoofPlane(rayAt(camera.camera, pixel, camera.width, camera.height), heightAt(centroid));
    return hit ? { pixel, at: [hit[0] + centroid[0], hit[1] + centroid[1]] } : null;
  }

  const lengthsAt = (index: number, at: XY) => {
    const n = roof.outline.length;
    const [before, after] = [roof.outline[(index - 1 + n) % n]!, roof.outline[(index + 1) % n]!];
    return `${shown(Math.hypot(at[0] - before[0], at[1] - before[1]), 1)} m · ${shown(Math.hypot(after[0] - at[0], after[1] - at[1]), 1)} m`;
  };

  return (
    <div ref={layer} className="pointer-events-none absolute inset-0 z-stage-overlay overflow-hidden contain-layout">
      {corners.map((label) => {
        const index = Number(label.id?.slice("outline-".length));
        const isMoving = moving?.index === index;
        const [x, y] = isMoving ? moving.pixel : [label.x, label.y];
        return (
          <div
            key={label.id}
            data-testid="outline-handle"
            aria-hidden="true"
            className={classNames(TARGET, isMoving && "cursor-grabbing")}
            style={measures({ x, y })}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              const point = pointOf(event);
              if (point) setMoving({ index, ...point });
            }}
            onPointerMove={(event) => {
              if (moving?.index !== index) return;
              const point = pointOf(event);
              if (point) setMoving({ index, ...point });
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              if (moving?.index === index) {
                const outline = withCornerMoved(roof.outline, index, moving.at);
                if (outline === null) void toasts.show({ kind: "note", words: OUTLINE_REFUSED });
                else if (outline !== roof.outline) store.getState().commit((design) => ({ ...design, roof: { ...design.roof, outline: outline.map(([x, y]): [number, number] => [x, y]) } }));
              }
              setMoving(null);
            }}
            onPointerCancel={() => setMoving(null)}
          >
            <span className={CORNER} />
          </div>
        );
      })}
      {moving ? (
        <code data-testid="outline-live" className={LIVE} style={measures({ x: moving.pixel[0], y: moving.pixel[1] })}>
          {lengthsAt(moving.index, moving.at)}
        </code>
      ) : null}
    </div>
  );
}
