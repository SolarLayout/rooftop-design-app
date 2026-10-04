// What the DOM over the stage is told by the camera (plan/phase-05-plan.md, decision 6): the labels of
// the roof's edges, which stand where the scene's points fall on the canvas, and the bearing that the
// north control shows. Pure functions; the Projector projects and the components draw.
import { Raycaster, Vector2, type Camera, type Ray } from "three";
import { shown } from "../../components/ui/number-entry";
import type { SceneXYZ, XY, XYZ } from "../geometry/adapter";

/**
 * A label of a dimension, the anchor of the callout of what is selected, a point a handle of the selected
 * obstacle is placed by, the sun's marker on its path, a mark of an hour on the path, or the chip of an
 * inverter over its box on the roof.
 */
export type LabelKind = "label" | "callout" | "handle" | "sun" | "hour" | "inverter";

/**
 * A label of the stage: its words and where it stands on the canvas, in pixels from its top left. A
 * handle's point has a name instead of words ("corner-2", "turn-foot"), by which the handles find it.
 */
export type StageLabel = { kind: LabelKind; id?: string; words: string; x: number; y: number; visible: boolean };

/** Where a label is anchored: a point in the engine's metres, and what it says. */
export type LabelPlace = { words: string; at: XYZ };

const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * The compass bearing of the line from one point of the scene to another, in degrees clockwise from
 * north, from 0 up to 360: what a camera at `from` looking at `toward` looks along. Three's x is east
 * and its z south. Straight down is north up.
 */
export function bearingOf(from: SceneXYZ, toward: SceneXYZ): number {
  const east = toward[0] - from[0];
  const north = from[2] - toward[2];
  return ((toDegrees(Math.atan2(east, north)) % 360) + 360) % 360;
}

/** The name of the north control: where the view looks, to the whole degree. */
export function northWordsOf(bearingDeg: number): string {
  const whole = Math.round(bearingDeg) % 360;
  if (whole === 0) return "North: the view looks north";
  if (whole === 180) return "North: the view looks south";
  if (whole < 180) return `North: the view looks ${whole}° east of north`;
  return `North: the view looks ${360 - whole}° west of north`;
}

/** One label per edge of the roof, at the edge's middle, at the roof's height there, saying the edge's length. */
export function labelPlacesOf(outline: readonly XY[], heightAt: (point: XY) => number): LabelPlace[] {
  return outline.map((a, index) => {
    const b = outline[(index + 1) % outline.length];
    const middle: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { words: `${shown(length, 1)} m`, at: [middle[0], middle[1], heightAt(middle)] };
  });
}

/** A point of the picture (from -1 to 1 each way, y up) as a pixel of the canvas, from its top left. */
export function pixelOf([x, y]: readonly [number, number], width: number, height: number): [number, number] {
  // Whole pixels: a label at a fraction of a pixel is drawn differently from one frame to the next.
  return [Math.round(((x + 1) / 2) * width), Math.round(((1 - y) / 2) * height)];
}

/** Whether two sets of labels stand the same, to the pixel: what is the same need not be drawn again. */
export function sameLabels(before: readonly StageLabel[], after: readonly StageLabel[]): boolean {
  if (before.length !== after.length) return false;
  return before.every((label, index) => {
    const other = after[index];
    return (
      label.kind === other.kind &&
      label.id === other.id &&
      label.words === other.words &&
      label.visible === other.visible &&
      Math.round(label.x) === Math.round(other.x) &&
      Math.round(label.y) === Math.round(other.y)
    );
  });
}

/** A stem shorter than this on screen, in pixels, points no way: the handle on it is not shown. */
const NO_WAY_WITHIN = 0.5;

/**
 * Where a handle on a stem stands on the canvas: `length` pixels from the stem's foot, the way the second
 * point lies from it on screen; null when the stem is seen end-on and points no way (the height handle in
 * the plan).
 */
export function stemEndOf(foot: readonly [number, number], toward: readonly [number, number], length: number): [number, number] | null {
  const [dx, dy] = [toward[0] - foot[0], toward[1] - foot[1]];
  const apart = Math.hypot(dx, dy);
  if (apart < NO_WAY_WITHIN) return null;
  return [foot[0] + (dx / apart) * length, foot[1] + (dy / apart) * length];
}

/** The ray through the camera at a pixel of the canvas, from its top left: what a pointer on the DOM over the stage points at. */
export function rayAt(camera: Camera, [px, py]: readonly [number, number], width: number, height: number): Ray {
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2((px / width) * 2 - 1, 1 - (py / height) * 2), camera);
  return raycaster.ray;
}
