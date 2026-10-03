// The thumbnail of a kept design (plan/phase-10-plan.md, step 13, decision 6): the plan of the kept layout's positions as an
// SVG string of 320 by 180, drawn as the plan without WebGL draws it (components/studio/PlanFallback.tsx, with the maths of
// lib/scene/plan.ts): the roof, the setback, the kept-clear areas, the obstacles and the modules, north up, in metres. It is
// kept with the design, so that its card shows the roof at once with no run and no canvas; deterministic, the same for a
// design saved from Performance or Handover where no scene is mounted. Its colours are the tokens of the page, by class.
import type { Layout, Roof } from "../api";
import { fittedViewBoxOf, footprintsOf, pathOf, viewBoxOf, type Polygon } from "../scene/plan";

/** The tile, in its own units. */
export const THUMBNAIL = { width: 320, height: 180 } as const;

/** Metres of ground about the roof, as the plan of the Array lens has it. */
const MARGIN = 3;

const WHAT_IT_IS = "The plan of the layout, north up: the roof, its obstacles and the module rows";

const path = (polygon: Polygon, attributes: string) => `<path d="${pathOf(polygon)}" ${attributes}/>`;

/** The plan of *roof* with the modules of *layout*, the roof and its obstacles alone while no layout has come. */
export function thumbnailOf(roof: Roof, layout: Layout | null): string {
  const box = fittedViewBoxOf(viewBoxOf(roof.outline, MARGIN), THUMBNAIL);
  const parts = [
    path({ exterior: roof.outline, holes: [] }, 'data-part="roof" vector-effect="non-scaling-stroke" class="fill-surface-2 stroke-accent stroke-outline"'),
    ...(layout?.inner ?? []).map((polygon) => path(polygon, 'data-part="inner" vector-effect="non-scaling-stroke" stroke-dasharray="0.6 0.4" class="fill-none stroke-line-strong"')),
    ...(layout?.modules ?? []).map((module) => path({ exterior: module.outline, holes: [] }, 'data-module="true" class="fill-data-gain"')),
    ...(layout?.keepout ?? []).flatMap((part) => part.polygons.map((polygon) => path(polygon, 'data-part="keepout" vector-effect="non-scaling-stroke" stroke-dasharray="0.5 0.3" class="fill-outline-fill stroke-accent"'))),
    ...footprintsOf(roof).map((polygon) => path(polygon, 'data-part="obstacle" class="fill-text-2"')),
  ];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.minX} ${box.minY} ${box.width} ${box.height}" width="${THUMBNAIL.width}" height="${THUMBNAIL.height}" ` +
    `preserveAspectRatio="xMidYMid meet" role="img" aria-label="${WHAT_IT_IS}">${parts.join("")}</svg>`
  );
}
