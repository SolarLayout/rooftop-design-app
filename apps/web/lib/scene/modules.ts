// Every position of the layout as a tilted quad, from what /layout answered (plan/phase-05-plan.md,
// decision 2): its plan footprint, its tilt, the way it faces and its heights. The browser places
// nothing. Pure functions in the engine's metres; the adapter alone turns them into three's.
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { Layout, PlacedModule } from "../api";
import { toScene, type XY, type XYZ } from "../geometry/adapter";

export type Placement = {
  /** The middle of the module, in the engine's metres, halfway up its slope. */
  centre: XYZ;
  /** Across the row: the side that lies along it. */
  width: number;
  /** Along the slope, from its lower edge to its upper. */
  length: number;
  tiltDeg: number;
  /** Where its lower edge faces, clockwise from north. */
  azimuthDeg: number;
};

export type Thickness = {
  thickness: number;
  /** How far along its normal the box is lifted: the glass stands over the frame. */
  lift: number;
  /** How much narrower and shorter than the module: the frame shows around the glass. */
  inset?: number;
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Where a position stands. Its footprint is the plan of the tilted module: its extent toward where it
 * faces is the slope's length foreshortened by the tilt. On a sloped roof the module lies on the pitch
 * at the flush clearance (decision 3), not at the engine's heights over a flat plane.
 */
export function placementOf(module: PlacedModule, kind: Layout["kind"], heightAt: (point: XY) => number, flushClearance: number): Placement {
  const facing = toRadians(module.azimuth);
  const toward: XY = [Math.sin(facing), Math.cos(facing)];
  const across: XY = [Math.cos(facing), -Math.sin(facing)];
  const along = module.outline.map(([x, y]) => x * toward[0] + y * toward[1]);
  const wide = module.outline.map(([x, y]) => x * across[0] + y * across[1]);
  const depth = Math.max(...along) - Math.min(...along);
  const width = Math.max(...wide) - Math.min(...wide);
  const x = module.outline.reduce((sum, [px]) => sum + px, 0) / module.outline.length;
  const y = module.outline.reduce((sum, [, py]) => sum + py, 0) / module.outline.length;
  const tilt = toRadians(module.tilt);
  const length = Math.cos(tilt) > 1e-9 ? depth / Math.cos(tilt) : module.z_high - module.z_low;
  const z = kind === "sloped_flush" ? heightAt([x, y]) + flushClearance : heightAt([x, y]) + (module.z_low + module.z_high) / 2;
  return { centre: [x, y, z], width, length, tiltDeg: module.tilt, azimuthDeg: module.azimuth };
}

const UP = new Vector3(0, 1, 0);

/**
 * The matrix that puts a unit box where the module is: as wide as it across the row, as thick as said,
 * as long as its slope; turned to face its azimuth (three's +z is south: a yaw of 180° − azimuth), then
 * tilted about the row so that the facing edge is the lower one; lifted along its normal by `lift`.
 */
export function moduleMatrixOf({ centre, width, length, tiltDeg, azimuthDeg }: Placement, { thickness, lift, inset = 0 }: Thickness): Matrix4 {
  const yaw = new Quaternion().setFromAxisAngle(UP, Math.PI - toRadians(azimuthDeg));
  const pitch = new Quaternion().setFromEuler(new Euler(toRadians(tiltDeg), 0, 0));
  const turn = yaw.multiply(pitch);
  const normal = new Vector3(0, 1, 0).applyQuaternion(turn);
  const [px, py, pz] = toScene(centre);
  const at = new Vector3(px, py, pz).addScaledVector(normal, lift);
  return new Matrix4().compose(at, turn, new Vector3(Math.max(0.01, width - inset), thickness, Math.max(0.01, length - inset)));
}

/** Metres the line through a string stands over the middles of its modules: clear of the glass, which lies a few centimetres over the centre. */
export const TRACE_LIFT = 0.06;

/**
 * The line through a string traced or selected (plan/phase-07-plan.md, decision 13): the middles of its positions in
 * the order they are wired, lifted over the glass, in the engine's metres. *idxs* is the idx of each placement; a
 * position the layout shown has not is passed over.
 */
export function traceLineOf(placements: readonly Placement[], idxs: readonly number[], wired: readonly number[]): XYZ[] {
  const indexOf = new Map(idxs.map((idx, index) => [idx, index]));
  return wired.flatMap((idx) => {
    const placement = placements[indexOf.get(idx) ?? -1];
    if (!placement) return [];
    const [x, y, z] = placement.centre;
    return [[x, y, z + TRACE_LIFT] satisfies XYZ];
  });
}
