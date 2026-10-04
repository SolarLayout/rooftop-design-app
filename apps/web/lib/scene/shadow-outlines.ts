// The engine's shadow outlines on the roof (plan/phase-06-plan.md, decision 9): the polygons /sun answered for
// the roof surface, as rings at the roof's height, lifted over it and over the kept-clear areas, so that the
// rendered shadows show inside them. Pure functions in the engine's metres.
import type { XY, XYZ } from "../geometry/adapter";

/** Over the roof, and over the kept-clear areas (2 cm and a little more each): 4 cm. */
export const OUTLINE_LIFT = 0.04;

type Polygon = { exterior: readonly (readonly [number, number])[]; holes: readonly (readonly (readonly [number, number])[])[] };

/** Every ring of every polygon, exterior and holes, at the roof's height there, lifted. */
export function ringsOf(polygons: readonly Polygon[], heightAt: (point: XY) => number): XYZ[][] {
  return polygons.flatMap((polygon) => [polygon.exterior, ...polygon.holes]).map((ring) => ring.map(([x, y]): XYZ => [x, y, heightAt([x, y]) + OUTLINE_LIFT]));
}
