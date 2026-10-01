// The obstacles of the document as the scene draws them, in the engine's metres (plan/phase-05-plan.md,
// step 3): each one as solids that stand on the roof, as the engine's `Obstacle.solids` approximates
// them, and its words for the text equivalent of the scene. Pure functions; the component makes
// geometries of what they give.
import { shown } from "../../components/ui/number-entry";
import type { Obstacle } from "../api";
import { areaOf, centroidOf } from "../outline/measure";
import { lengthOf, type DraftObstacle } from "../studio/obstacle-fields";
import type { Box, XY, XYZ } from "./adapter";
import type { Callout } from "./keepout";

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

/** A cylinder's side, and the circle of a footprint, are this many flat faces, as the engine's discs are. */
export const ROUND_SEGMENTS = 24;

/** Why the callout of an obstacle stands: it is selected, it is a draft, or its height is to be reviewed. */
export type ObstacleState = "selected" | "draft" | "to-review";

/** The size of an obstacle with its unit, as its callout says it. */
function sizeInMetres(obstacle: Obstacle | DraftObstacle): string {
  const { kind, points } = obstacle;
  if (kind === "box") return `${shown(obstacle.length, 1)} × ${shown(obstacle.width, 1)} m`;
  if (kind === "cylinder") return `⌀ ${shown(obstacle.diameter, 1)} m`;
  if (kind === "tree") return `crown ⌀ ${shown(obstacle.diameter, 1)} m`;
  if (kind === "wall") return `${shown(lengthOf(points), 1)} m long`;
  return `${shown(Math.round(areaOf(points.map(([x, y]) => ({ x, y })))), 0)} m²`;
}

/**
 * The callout of an obstacle (the boards "Obstacle edited on the roof" and "Import with missing heights"):
 * its name and why it stands out, then its size and its height, or what its height waits for.
 */
export function calloutOfObstacle(obstacle: Obstacle | DraftObstacle, state: ObstacleState): Callout {
  const title = `${obstacle.name} · ${state === "draft" ? "draft" : "selected"}`;
  if (state === "draft" || obstacle.height === null) return { title, detail: `${sizeInMetres(obstacle)} · type its height to add it` };
  if (state === "to-review") return { title, detail: `${sizeInMetres(obstacle)} · height to review` };
  if (obstacle.kind === "tree") {
    return { title, detail: `${sizeInMetres(obstacle)} from ${shown(obstacle.trunk_height, 1)} to ${shown(obstacle.height, 1)} m` };
  }
  return { title, detail: `${sizeInMetres(obstacle)} · ${shown(obstacle.height, 1)} m high` };
}

/** The point of a polyline half way along it. */
function halfWayAlong(points: readonly XY[]): XY {
  const half = lengthOf(points) / 2;
  let walked = 0;
  for (let n = 1; n < points.length; n += 1) {
    const [a, b] = [points[n - 1], points[n]];
    const step = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (walked + step >= half && step > 0) {
      const share = (half - walked) / step;
      return [a[0] + (b[0] - a[0]) * share, a[1] + (b[1] - a[1]) * share];
    }
    walked += step;
  }
  return points[0] ?? [0, 0];
}

/** The centre of an obstacle's plan: where it stands, half way along a wall, the centroid of a building. */
export function centreOf(obstacle: Obstacle | DraftObstacle): XY {
  if (obstacle.kind === "wall") return halfWayAlong(obstacle.points);
  if (obstacle.kind === "building") {
    const { x, y } = centroidOf(obstacle.points.map(([px, py]) => ({ x: px, y: py })));
    return [x, y];
  }
  return [obstacle.x, obstacle.y];
}

/** Where the callout of an obstacle is hung: the top of the obstacle over its centre; a draft has no height, so the roof. */
export function anchorOfObstacle(obstacle: Obstacle | DraftObstacle, heightAt: HeightAt): XYZ {
  const [x, y] = centreOf(obstacle);
  return [x, y, heightAt([x, y]) + (obstacle.height ?? 0)];
}

export type Footprint = { points: readonly XY[]; closed: boolean };

/** A circle about a centre, as a ring of flat segments. */
function circleOf([cx, cy]: XY, radius: number): XY[] {
  return Array.from({ length: ROUND_SEGMENTS }, (_, n) => {
    const angle = (2 * Math.PI * n) / ROUND_SEGMENTS;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  });
}

/**
 * The footprint of an obstacle on the roof plane: a box's corners turned about its centre, counter-clockwise
 * from the south-west as the engine turns it; a tank's or a tree's crown as a circle; a wall's points, open;
 * a building's, closed. A draft is drawn by it, dashed, before it has a height (decision 15).
 */
export function footprintOf(obstacle: Obstacle | DraftObstacle): Footprint {
  const { kind, x, y, points } = obstacle;
  if (kind === "wall") return { points, closed: false };
  if (kind === "building") return { points, closed: true };
  if (kind === "cylinder" || kind === "tree") return { points: circleOf([x, y], obstacle.diameter / 2), closed: true };
  const turn = (obstacle.rotation_deg * Math.PI) / 180;
  const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
  const [half, deep] = [obstacle.length / 2, obstacle.width / 2];
  const corners: XY[] = [
    [-half, -deep],
    [half, -deep],
    [half, deep],
    [-half, deep],
  ];
  return { points: corners.map(([dx, dy]) => [x + dx * cos - dy * sin, y + dx * sin + dy * cos]), closed: true };
}
