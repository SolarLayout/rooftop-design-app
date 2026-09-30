// The building and its roof as the scene draws them, in the engine's metres (plan/phase-05-plan.md,
// decisions 2 and 3): the frame of the scene about the roof's centroid, the pitch of a sloped roof, the
// parapet as walls, the walls of the building from the ground to the roof's edge. Pure functions; the
// components make geometries of what they give.
import type { Roof } from "../api";
import { centroidOf } from "../outline/measure";
import type { Box, XY, XYZ } from "./adapter";

/** What of a roof the scene needs to draw the building. */
export type RoofOfTheScene = Pick<Roof, "outline" | "parapet_h" | "slope_deg" | "slope_azimuth_deg" | "roof_type">;

export type Frame = {
  /** The origin of the scene: the centroid of the roof's area, in the engine's metres. */
  centroid: XY;
  /** How far the farthest corner is from it: what the camera and the shadows are sized by. */
  radius: number;
  /** The height of the roof surface above the flat plane through the centroid, at a point of the plan. */
  heightAt: (point: XY) => number;
};

/** The parapet's thickness, which the engine does not expose (functional-inventory.md, 1.1). */
export const PARAPET_THICKNESS = 0.2;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * The frame of the scene. A sloped roof falls toward the direction it faces, about the line through the
 * centroid at right angles to that direction; the engine treats the surface as flat (decision 3).
 */
export function frameOf(roof: RoofOfTheScene): Frame {
  const centre = centroidOf(roof.outline.map(([x, y]) => ({ x, y })));
  const centroid: XY = [centre.x, centre.y];
  const radius = Math.max(...roof.outline.map(([x, y]) => Math.hypot(x - centre.x, y - centre.y)));
  const isSloped = roof.roof_type === "sloped_flush" && roof.slope_deg > 0;
  const fall = isSloped ? Math.tan(toRadians(roof.slope_deg)) : 0;
  const facing = toRadians(roof.slope_azimuth_deg);
  const toward: XY = [Math.sin(facing), Math.cos(facing)];
  return {
    centroid,
    radius,
    heightAt: ([x, y]) => (fall === 0 ? 0 : -fall * ((x - centre.x) * toward[0] + (y - centre.y) * toward[1])),
  };
}

/** Twice the signed area: positive when the outline goes counter-clockwise. */
function turnOf(outline: readonly XY[]): number {
  return outline.reduce((sum, [x, y], index) => {
    const [nx, ny] = outline[(index + 1) % outline.length];
    return sum + x * ny - nx * y;
  }, 0);
}

/** The edges of the outline, each from a corner to the next, with the unit normal that points inside. */
function edgesOf(outline: readonly XY[]): Array<{ a: XY; b: XY; inward: XY; length: number }> {
  const inside = turnOf(outline) >= 0 ? 1 : -1;
  return outline.map((a, index) => {
    const b = outline[(index + 1) % outline.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const along: XY = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    return { a, b, length, inward: [-along[1] * inside, along[0] * inside] };
  });
}

const round = (value: number) => Number(value.toFixed(9));

/** The parapet: one wall along each edge, inside it by half its thickness, as the engine's `parapet_walls`. */
export function parapetWallsOf(roof: RoofOfTheScene): Box[] {
  if (roof.parapet_h <= 0) return [];
  const { heightAt } = frameOf(roof);
  return edgesOf(roof.outline).map(({ a, b, inward, length }) => {
    const x = round((a[0] + b[0]) / 2 + (inward[0] * PARAPET_THICKNESS) / 2);
    const y = round((a[1] + b[1]) / 2 + (inward[1] * PARAPET_THICKNESS) / 2);
    const rotationDeg = round((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
    return { x, y, length: round(length), width: PARAPET_THICKNESS, height: roof.parapet_h, rotationDeg, zBottom: heightAt([x, y]) };
  });
}

/**
 * One wall of the building: the quad under the edge that begins at corner `index`, from `depth` below
 * the centroid's plane up to the roof's edge, corner by corner (the ground first, then the roof).
 */
export function wallOf(roof: RoofOfTheScene, index: number, depth: number): [XYZ, XYZ, XYZ, XYZ] {
  const { heightAt } = frameOf(roof);
  const a = roof.outline[index];
  const b = roof.outline[(index + 1) % roof.outline.length];
  return [
    [a[0], a[1], -depth],
    [b[0], b[1], -depth],
    [b[0], b[1], heightAt(b)],
    [a[0], a[1], heightAt(a)],
  ];
}
