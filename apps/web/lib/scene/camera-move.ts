// The camera's move between two presets (plan/phase-10-plan.md, step 17, decision 10; plan/reference/r3f-notes.md,
// fix 13): asked for by Present alone, with a time to take. The path turns about the roof's centre the short way,
// its distance from the roof going from the one stand's to the other's, eased in and out; the camera chases the
// path's point with a time constant, so that nothing jumps and no frame allocates. The path never goes below the
// roof (docs/design/guidelines.md, "3D scene"). Pure, in three's metres: x east, y up, z south.
import type { SceneXYZ } from "./adapter";

/** The pole is held this much above the roof plane, in radians: the camera never goes below it (the rig's limit too). */
export const ABOVE_THE_ROOF = 0.03;

/** The time constant of the chase, in seconds: the camera closes two thirds of its gap to the path's point in this long. */
export const SETTLE_TIME = 0.12;

const clamp = (share: number) => Math.min(1, Math.max(0, share));

/** Smooth at both ends: 3s² − 2s³. */
export function easeInOut(share: number): number {
  const s = clamp(share);
  return s * s * (3 - 2 * s);
}

/** A stand straight above the roof is moved a hair south, so that north is up on the screen and the camera has a way to look. */
export function offTheZenith([x, y, z]: SceneXYZ): SceneXYZ {
  if (x !== 0 || z !== 0) return [x, y, z];
  return [x, y, y * 0.001];
}

/** The point of the path from one stand to another at a share of the way; the share is eased by the caller. */
export function pathAt(from: SceneXYZ, to: SceneXYZ, share: number): SceneXYZ {
  const s = clamp(share);
  const lengthFrom = Math.hypot(...from);
  const lengthTo = Math.hypot(...to);
  const a = from.map((value) => value / lengthFrom);
  const b = to.map((value) => value / lengthTo);
  const dot = Math.min(1, Math.max(-1, a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!));
  const angle = Math.acos(dot);
  // Two stands along one line turn nowhere: the way between them is straight.
  const [wa, wb] = angle < 1e-6 ? [1 - s, s] : [Math.sin((1 - s) * angle) / Math.sin(angle), Math.sin(s * angle) / Math.sin(angle)];
  const direction: SceneXYZ = [wa * a[0]! + wb * b[0]!, wa * a[1]! + wb * b[1]!, wa * a[2]! + wb * b[2]!];
  const distance = lengthFrom + (lengthTo - lengthFrom) * s;
  return aboveTheRoof(direction, distance);
}

/** A direction at a distance from the roof's centre, its pole held above the roof plane. */
function aboveTheRoof([x, y, z]: SceneXYZ, distance: number): SceneXYZ {
  const flat = Math.hypot(x, z);
  const polar = Math.atan2(flat, y);
  const limit = Math.PI / 2 - ABOVE_THE_ROOF;
  if (polar <= limit) return [x * distance, y * distance, z * distance];
  const azimuth = Math.atan2(x, z);
  return [Math.sin(limit) * Math.sin(azimuth) * distance, Math.cos(limit) * distance, Math.sin(limit) * Math.cos(azimuth) * distance];
}

/** The share of the gap to its target the camera closes in a frame of `delta` seconds. */
export function settleShareOf(delta: number): number {
  return 1 - Math.exp(-Math.max(0, delta) / SETTLE_TIME);
}

/** Whether the camera stands at its target, give or take a thousandth of the roof's radius. */
export function isSettled(distance: number, radius: number): boolean {
  return distance < radius / 1000;
}
