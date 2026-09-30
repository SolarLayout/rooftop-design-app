// The plan of the roof drawn without WebGL (plan/phase-05-plan.md, step 9): the same layout as an SVG in
// metres, north up. SVG's y grows downward, so every y is turned; nothing else converts.
import type { XY } from "./adapter";

export type ViewBox = { minX: number; minY: number; width: number; height: number };

export type Polygon = { exterior: readonly (readonly [number, number])[]; holes: readonly (readonly (readonly [number, number])[])[] };

/** The box that holds the corners with a margin around them, in SVG's turned metres. */
export function viewBoxOf(corners: readonly XY[], margin: number): ViewBox {
  if (corners.length === 0) return { minX: -margin, minY: -margin, width: 2 * margin, height: 2 * margin };
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const minX = Math.min(...xs) - margin;
  const maxX = Math.max(...xs) + margin;
  const minY = Math.min(...ys) - margin;
  const maxY = Math.max(...ys) + margin;
  return { minX, minY: -maxY, width: maxX - minX, height: maxY - minY };
}

const number = (value: number) => String(Number(value.toFixed(3)));

function ringOf(ring: readonly (readonly [number, number])[]): string {
  return ring.map(([x, y], index) => `${index === 0 ? "M" : "L"}${number(x)} ${number(-y)}`).join("") + "Z";
}

/** A polygon with its holes as one SVG path, north up. */
export function pathOf(polygon: Polygon): string {
  return [polygon.exterior, ...polygon.holes].map(ringOf).join("");
}
