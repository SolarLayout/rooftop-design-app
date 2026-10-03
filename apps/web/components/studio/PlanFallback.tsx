"use client";

import { classNames } from "@/components/ui/class-names";
import { NorthIcon } from "@/components/find/NorthIcon";
import type { Layout, Roof } from "@/lib/api";
import { footprintsOf, pathOf, viewBoxOf } from "@/lib/scene/plan";

type Props = {
  roof: Roof;
  /** The layout of the design; null while none has come, and the roof stands alone. */
  layout: Layout | null;
  /** Why the plan stands in for the scene, said where the attribution would be. */
  reason: string;
  className?: string;
};

/** Metres of room around the roof. */
const MARGIN = 6;

/**
 * The plan of the design where the scene cannot draw (plan step 9, docs/design/guidelines.md, "No
 * WebGL"): the roof, the setback, the kept-clear areas, the obstacles and the modules, north up, in
 * metres, from the same layout the scene draws. Lines keep their width whatever the scale.
 */
export function PlanFallback({ roof, layout, reason, className }: Props) {
  const box = viewBoxOf(roof.outline, MARGIN);
  return (
    <div data-testid="plan-fallback" className={classNames("relative size-full overflow-hidden bg-ground", className)}>
      <svg viewBox={`${box.minX} ${box.minY} ${box.width} ${box.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plan of the roof, north up" className="absolute inset-0 size-full">
        <path d={pathOf({ exterior: roof.outline, holes: [] })} vectorEffect="non-scaling-stroke" className="fill-surface-2 stroke-accent stroke-outline" />
        {layout?.inner.map((polygon, n) => (
          <path key={`inner-${n}`} d={pathOf(polygon)} vectorEffect="non-scaling-stroke" className="fill-none stroke-line-strong" strokeDasharray="0.6 0.4" />
        ))}
        {layout?.modules.map((module) => (
          <path key={module.idx} data-testid="plan-module" d={pathOf({ exterior: module.outline, holes: [] })} className="fill-data-gain" />
        ))}
        {layout?.keepout.flatMap((part, n) =>
          part.polygons.map((polygon, m) => <path key={`keepout-${n}-${m}`} d={pathOf(polygon)} vectorEffect="non-scaling-stroke" className="fill-outline-fill stroke-accent" strokeDasharray="0.5 0.3" />),
        )}
        {footprintsOf(roof).map((polygon, n) => (
          <path key={`obstacle-${n}`} d={pathOf(polygon)} className="fill-text-2" />
        ))}
      </svg>
      <span aria-hidden="true" className="absolute top-5 right-5 flex size-touch items-center justify-center rounded-row border border-line bg-surface-1 shadow-float">
        <NorthIcon />
      </span>
      <p role="status" className="absolute inset-x-4 bottom-2 type-small text-text-2">
        {reason}
      </p>
    </div>
  );
}
