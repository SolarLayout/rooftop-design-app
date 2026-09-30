// The one place that turns the engine's metres into three's (plan/phase-05-plan.md, decision 1). The
// engine and the stores are x east, y north, z up; three is x east, y up, z south. Every module of
// lib/scene works in the engine's metres and hands this adapter its result; nothing else converts.
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

/** A point in the engine's metres: x east, y north, z up. */
export type XYZ = readonly [x: number, y: number, z: number];

/** A point of the plan in the engine's metres: x east, y north. */
export type XY = readonly [x: number, y: number];

/** A point in three's metres: x east, y up, z south. */
export type SceneXYZ = [x: number, y: number, z: number];

export function toScene([x, y, z]: XYZ): SceneXYZ {
  return [x, z, -y];
}

export function fromScene([x, y, z]: SceneXYZ): [number, number, number] {
  return [x, -z, y];
}

/** A point of the plan, at a height above the roof plane (on it unless said). */
export function toScenePoint([x, y]: XY, height = 0): SceneXYZ {
  return toScene([x, y, height]);
}

/**
 * The rotation that lays a shape drawn in the engine's (x, y) flat on the roof plane: its y goes to
 * north (minus z), its face looks up.
 */
export const FLAT = new Euler(-Math.PI / 2, 0, 0);

export type Box = {
  /** The centre of its plan, in the engine's metres. */
  x: number;
  y: number;
  /** Along the engine's x before it is turned. */
  length: number;
  width: number;
  height: number;
  /** Counter-clockwise seen from above, in degrees, as the engine counts it. */
  rotationDeg: number;
  /** Where its bottom is above the roof plane; on it unless said. */
  zBottom?: number;
};

const UP = new Vector3(0, 1, 0);

/** The matrix that puts a unit cube where a box of the engine stands: its size, its turn, its place. */
export function boxMatrixOf({ x, y, length, width, height, rotationDeg, zBottom = 0 }: Box): Matrix4 {
  const turn = new Quaternion().setFromAxisAngle(UP, (rotationDeg * Math.PI) / 180);
  const [px, py, pz] = toScene([x, y, zBottom + height / 2]);
  return new Matrix4().compose(new Vector3(px, py, pz), turn, new Vector3(length, height, width));
}
