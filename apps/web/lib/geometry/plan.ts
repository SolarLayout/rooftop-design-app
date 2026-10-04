// The plan of the roof drawn without WebGL (plan/phase-05-plan.md, step 9), and the thumbnail of a kept design (plan/phase-10-plan.md,
// decision 6): the same layout as an SVG in metres, north up. SVG's y grows downward, so every y is turned; nothing else converts.
import type { Roof } from "../api";
import type { XY } from "./adapter";
import { solidsOf } from "./obstacles";

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

const round = (value: number) => Number(value.toFixed(3));

/** The box grown about its middle to the shape of *frame* (a tile of 320 by 180), so that the drawing fills the frame. */
export function fittedViewBoxOf(box: ViewBox, frame: { width: number; height: number }): ViewBox {
  const aspect = frame.width / frame.height;
  if (box.width / box.height > aspect) {
    const height = box.width / aspect;
    return { minX: box.minX, minY: round(box.minY - (height - box.height) / 2), width: box.width, height: round(height) };
  }
  const width = box.height * aspect;
  return { minX: round(box.minX - (width - box.width) / 2), minY: box.minY, width: round(width), height: box.height };
}

const flat = () => 0;
const ROUND_POINTS = 24;

/** The footprints of the obstacles as polygons of the plan, from their solids: a box's corners, a disc, a prism's points. */
export function footprintsOf(roof: Roof): Polygon[] {
  return roof.obstacles.flatMap((obstacle) =>
    solidsOf(obstacle, flat).flatMap((solid): Polygon[] => {
      if (solid.kind === "box") {
        const { x, y, length, width, rotationDeg } = solid.box;
        const turn = (rotationDeg * Math.PI) / 180;
        const corner = (dx: number, dy: number): [number, number] => [x + dx * Math.cos(turn) - dy * Math.sin(turn), y + dx * Math.sin(turn) + dy * Math.cos(turn)];
        return [{ exterior: [corner(-length / 2, -width / 2), corner(length / 2, -width / 2), corner(length / 2, width / 2), corner(-length / 2, width / 2)], holes: [] }];
      }
      if (solid.kind === "cylinder") {
        const points = Array.from({ length: ROUND_POINTS }, (_, n): [number, number] => [solid.x + solid.radius * Math.cos((n / ROUND_POINTS) * 2 * Math.PI), solid.y + solid.radius * Math.sin((n / ROUND_POINTS) * 2 * Math.PI)]);
        return [{ exterior: points, holes: [] }];
      }
      return [{ exterior: solid.points.map(([x, y]): [number, number] => [x, y]), holes: [] }];
    }),
  );
}
