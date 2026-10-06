// Where the camera stands and how far it may go, from the roof's radius (plan/phase-05-plan.md,
// decision 17; plan/reference/r3f-notes.md, fixes 9 and 13). In three's metres: x east, y up, z south.
import type { CameraPreset } from "../stores/view-store";
import type { SceneXYZ } from "../geometry/adapter";
import { DOME } from "./sun-path";

/** The sun as the API gives it: above the horizon, clockwise from north. */
export type Sun = { elevationDeg: number; azimuthDeg: number };

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** The unit vector toward the sun, in three's metres. */
export function sunDirectionOf({ elevationDeg, azimuthDeg }: Sun): SceneXYZ {
  const elevation = toRadians(elevationDeg);
  const azimuth = toRadians(azimuthDeg);
  // East is sin of the azimuth, north its cos; north is minus z.
  return [Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation), -Math.cos(elevation) * Math.cos(azimuth)];
}

/** The distance of the 3D view: the whole of what is framed in the frame with room around it. */
const fitDistance = (radius: number) => radius * 2.4;

/**
 * The radius the presets frame (plan/phase-11-plan.md, step 33): the roof's, unless the sun path is drawn, when it is
 * the path's dome about the roof, so that the sun's marker stays on the canvas through the day. In the Sun lens with
 * the path on, Fit and the 3D view frame the dome; every other lens frames the roof as before.
 */
export function framedRadiusOf(radius: number, isSunPathShown: boolean): number {
  return isSunPathShown ? radius * DOME : radius;
}

/** The room around the roof in the plan, as a share of its diameter. */
const PLAN_ROOM = 1.15;

/** The least height of the sun's eye, as a share of its distance: a sun on the horizon still looks down. */
const LOWEST_SUN_EYE = 0.15;

/**
 * Where a preset puts the camera. The field of view is upright: on a canvas taller than wide (Present on tablet) the view
 * stands back by the aspect, so that the width holds what the height would (D72); the plan's zoom fits the shorter side.
 */
export function presetPositionOf(preset: CameraPreset, radius: number, sun: Sun | null, aspect = 1): SceneXYZ {
  if (preset === "plan") return [0, fitDistance(radius) * 1.2, 0];
  const distance = fitDistance(radius) / Math.min(1, aspect);
  if (preset === "sun-eye" && sun) {
    const [x, y, z] = sunDirectionOf(sun);
    const lifted = Math.max(LOWEST_SUN_EYE, y);
    const length = Math.hypot(x, lifted, z);
    return [(x / length) * distance, (lifted / length) * distance, (z / length) * distance];
  }
  // From the south-west, above the roof: the view of the boards.
  const length = Math.hypot(-0.62, 0.5, 0.6);
  return [(-0.62 / length) * distance, (0.5 / length) * distance, (0.6 / length) * distance];
}

/** The camera's near and far planes, scaled to the roof so that the depth buffer is not starved (fix 9). */
export function nearAndFarOf(radius: number): { near: number; far: number } {
  return { near: radius * 0.05, far: radius * 30 };
}

/** How near and how far the orbit may go. */
export function distanceLimitsOf(radius: number): { min: number; max: number } {
  return { min: Math.max(2, radius * 0.2), max: radius * 12 };
}

/** The zoom of the plan's camera, in pixels per metre: the roof's diameter with room around it fills the shorter side. */
export function planZoomOf(radius: number, width: number, height: number): number {
  return Math.min(width, height) / (2 * radius * PLAN_ROOM);
}

/** How near and how far the plan may zoom, about the zoom that fits: the orbit's range, in zoom. */
export function zoomLimitsOf(fit: number): { min: number; max: number } {
  return { min: fit / 12, max: fit * 5 };
}
