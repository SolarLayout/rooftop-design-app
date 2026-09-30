// The obstacles of the document as the scene draws them, in the engine's metres (plan/phase-05-plan.md,
// step 3): each one as solids that stand on the roof, as the engine's `Obstacle.solids` approximates
// them, and its words for the text equivalent of the scene. Pure functions; the component makes
// geometries of what they give.
import { shown } from "../../components/ui/number-entry";
import type { Obstacle } from "../api";
import { areaOf, centroidOf } from "../outline/measure";
import type { Box, XY } from "./adapter";

/** What a cylinder is painted as: an obstacle, or a part of a tree. */
export type Look = "obstacle" | "trunk" | "crown";

export type Solid =
  | { kind: "box"; box: Box }
  | { kind: "cylinder"; x: number; y: number; radius: number; zBottom: number; height: number; look: Look }
  | { kind: "prism"; points: XY[]; zBottom: number; height: number };

/** The height of the roof surface at a point of the plan: `Frame.heightAt` of building.ts. */
export type HeightAt = (point: XY) => number;

/** A tree's trunk is 0.3 m wide, as the engine takes it. */
export const TRUNK_RADIUS = 0.15;

const round = (value: number) => Number(value.toFixed(9));

/** One box along a segment: its centre at the middle, its length the segment's, its width the thickness. */
function segmentBoxOf(a: XY, b: XY, thickness: number, height: number, heightAt: HeightAt): Solid {
  const x = round((a[0] + b[0]) / 2);
  const y = round((a[1] + b[1]) / 2);
  const length = round(Math.hypot(b[0] - a[0], b[1] - a[1]));
  const rotationDeg = round((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
  return { kind: "box", box: { x, y, length, width: thickness, height, rotationDeg, zBottom: heightAt([x, y]) } };
}

/**
 * The solids of an obstacle, each standing at the roof's height under its centre. A wall is one box
 * per segment; a tree a trunk and a crown; a building a prism of its outline. What the engine added
 * itself (`auto`) is none: the scene draws the parapet from the roof.
 */
export function solidsOf(obstacle: Obstacle, heightAt: HeightAt): Solid[] {
  if (obstacle.auto) return [];
  const { kind, x, y, height, points } = obstacle;
  if (kind === "box") {
    const { length, width, rotation_deg: rotationDeg } = obstacle;
    return [{ kind, box: { x, y, length, width, height, rotationDeg, zBottom: heightAt([x, y]) } }];
  }
  if (kind === "cylinder") {
    return [{ kind, x, y, radius: obstacle.diameter / 2, zBottom: heightAt([x, y]), height, look: "obstacle" }];
  }
  if (kind === "tree") {
    const foot = heightAt([x, y]);
    const { trunk_height: trunkHeight } = obstacle;
    return [
      { kind: "cylinder", x, y, radius: TRUNK_RADIUS, zBottom: foot, height: trunkHeight, look: "trunk" },
      { kind: "cylinder", x, y, radius: obstacle.diameter / 2, zBottom: foot + trunkHeight, height: height - trunkHeight, look: "crown" },
    ];
  }
  if (kind === "wall") {
    return points.slice(1).map((b, n) => segmentBoxOf(points[n], b, obstacle.thickness, height, heightAt));
  }
  if (points.length < 3) return [];
  const centre = centroidOf(points.map(([px, py]) => ({ x: px, y: py })));
  return [{ kind: "prism", points: points.map(([px, py]) => [px, py]), zBottom: heightAt([centre.x, centre.y]), height }];
}

/** The length of a polyline, point to point. */
function lengthOf(points: readonly XY[]): number {
  return points.slice(1).reduce((sum, [px, py], n) => sum + Math.hypot(px - points[n][0], py - points[n][1]), 0);
}

/** The size of an obstacle, in the words of the Roof lens's list (`sizeOf` of lib/outline/obstacles.ts). */
function sizeWordsOf(obstacle: Obstacle): string {
  const { kind, points } = obstacle;
  if (kind === "box") return `box ${shown(obstacle.length, 1)} × ${shown(obstacle.width, 1)} m`;
  if (kind === "cylinder") return `tank ⌀ ${shown(obstacle.diameter, 1)} m`;
  if (kind === "tree") return `tree, crown ⌀ ${shown(obstacle.diameter, 1)} m`;
  if (kind === "wall") return `wall ${shown(lengthOf(points), 1)} m long`;
  return `building ${shown(Math.round(areaOf(points.map(([x, y]) => ({ x, y })))), 0)} m²`;
}

/** The text equivalent of an obstacle: its name, its kind and size, its height. */
export function wordsOf(obstacle: Obstacle): string {
  return `${obstacle.name}, ${sizeWordsOf(obstacle)}, ${shown(obstacle.height, 1)} m high`;
}
