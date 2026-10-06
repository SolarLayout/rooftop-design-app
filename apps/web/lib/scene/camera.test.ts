import { describe, expect, test } from "bun:test";
import { PerspectiveCamera, Vector3 } from "three";
import { toScene } from "../geometry/adapter";
import { distanceLimitsOf, framedRadiusOf, nearAndFarOf, planZoomOf, presetPositionOf, zoomLimitsOf, type Sun } from "./camera";
import { pixelOf } from "./projection";
import { DOME, pointOnDomeOf } from "./sun-path";

// Where the camera stands for each preset, from the roof's radius (plan decision 17, r3f-notes fixes 9
// and 13). In three's metres: x east, y up, z south.

const RADIUS = 49.24; // the demo roof
const CENTRE = [45, 20] as const;

/** The stage on desktop: 1440 less the rail of 72 and the inspector of 384, by 900 less the top bar of 56. */
const DESKTOP = { width: 984, height: 844 };

/** The sun of the demo's design day, 21 December at Pune: the day's extremes, the hour the Sun lens opens at, the window's end. */
const DAY_355: Record<string, Sun> = {
  sunrise: { elevationDeg: 0, azimuthDeg: 114.9 },
  "10:30": { elevationDeg: 42.6, azimuthDeg: 151.5 },
  noon: { elevationDeg: 48.03, azimuthDeg: 180 },
  "16:00": { elevationDeg: 17.972, azimuthDeg: 236.642 },
  sunset: { elevationDeg: 0, azimuthDeg: 245.1 },
};

/** Where a point of the sun path over the demo falls on a canvas, from the 3D preset framing `framed` metres about the roof's centre. */
function pixelOfTheSun(sun: Sun, framed: number, { width, height }: { width: number; height: number }): [number, number] {
  const camera = new PerspectiveCamera(45, width / height, 1, 1000);
  const [x, y, z] = presetPositionOf("3d", framed, null);
  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const [px, py, pz] = pointOnDomeOf(sun, CENTRE, RADIUS);
  const [sx, sy, sz] = toScene([px - CENTRE[0], py - CENTRE[1], pz]);
  const point = new Vector3(sx, sy, sz).project(camera);
  return pixelOf([point.x, point.y], width, height);
}

const isOn = ([x, y]: readonly [number, number], { width, height }: { width: number; height: number }) => x >= 0 && x <= width && y >= 0 && y <= height;

describe("the presets", () => {
  test("3D looks at the roof from the south-west, above it", () => {
    const [x, y, z] = presetPositionOf("3d", RADIUS, null);
    expect(x).toBeLessThan(0);
    expect(y).toBeGreaterThan(0);
    expect(z).toBeGreaterThan(0);
    expect(Math.hypot(x, y, z)).toBeGreaterThan(RADIUS * 1.5);
  });

  test("a portrait canvas: the 3D view stands back by its aspect, so that its width holds what its height would (Present on tablet, D72)", () => {
    const length = (at: readonly number[]) => Math.hypot(at[0]!, at[1]!, at[2]!);
    const square = length(presetPositionOf("3d", RADIUS, null));
    expect(length(presetPositionOf("3d", RADIUS, null, 1.6))).toBeCloseTo(square, 6);
    expect(length(presetPositionOf("3d", RADIUS, null, 834 / 1194))).toBeCloseTo(square / (834 / 1194), 6);
    expect(length(presetPositionOf("plan", RADIUS, null, 0.5))).toBeCloseTo(length(presetPositionOf("plan", RADIUS, null)), 6);
  });

  test("Fit is the 3D view framed again", () => {
    expect(presetPositionOf("fit", RADIUS, null)).toEqual(presetPositionOf("3d", RADIUS, null));
  });

  test("Plan looks straight down from far enough to see the whole roof, north up", () => {
    const [x, y, z] = presetPositionOf("plan", RADIUS, null);
    expect(x).toBe(0);
    expect(z).toBe(0);
    expect(y).toBeGreaterThan(RADIUS * 2);
  });

  test("the sun's eye stands along the sun, at the fit distance; a low sun is lifted", () => {
    const distance = Math.hypot(...presetPositionOf("3d", RADIUS, null));
    const [x, y, z] = presetPositionOf("sun-eye", RADIUS, { elevationDeg: 45, azimuthDeg: 180 });
    expect(x).toBeCloseTo(0, 6);
    expect(z).toBeGreaterThan(0);
    expect(y).toBeCloseTo(z, 6);
    expect(Math.hypot(x, y, z)).toBeCloseTo(distance, 6);

    const [, low] = presetPositionOf("sun-eye", RADIUS, { elevationDeg: 2, azimuthDeg: 90 });
    expect(low).toBeGreaterThan(distance * 0.1);
  });

  test("without a sun the sun's eye is the 3D view", () => {
    expect(presetPositionOf("sun-eye", RADIUS, null)).toEqual(presetPositionOf("3d", RADIUS, null));
  });
});

describe("what is framed (plan/phase-11-plan.md, step 33)", () => {
  test("the roof, unless the sun path is drawn: then its dome, 1.3 times the roof", () => {
    expect(framedRadiusOf(RADIUS, false)).toBe(RADIUS);
    expect(framedRadiusOf(RADIUS, true)).toBe(RADIUS * DOME);
  });

  test("framing the roof alone, the demo's sun at 10:30 and at sunset fall off the desktop canvas: the fault of the open item", () => {
    expect(isOn(pixelOfTheSun(DAY_355["10:30"]!, RADIUS, DESKTOP), DESKTOP)).toBe(false);
    expect(isOn(pixelOfTheSun(DAY_355.sunset!, RADIUS, DESKTOP), DESKTOP)).toBe(false);
  });

  test.each(Object.keys(DAY_355))("framing the dome, the demo's sun at %s falls on the desktop canvas, clear of its edge by the marker's size", (hour) => {
    const [x, y] = pixelOfTheSun(DAY_355[hour]!, framedRadiusOf(RADIUS, true), DESKTOP);
    const margin = 20;

    expect(x).toBeGreaterThanOrEqual(margin);
    expect(x).toBeLessThanOrEqual(DESKTOP.width - margin);
    expect(y).toBeGreaterThanOrEqual(margin);
    expect(y).toBeLessThanOrEqual(DESKTOP.height - margin);
  });

  test("on tablet and phone too", () => {
    for (const size of [
      { width: 834, height: 508 },
      { width: 390, height: 252 },
    ]) {
      for (const sun of Object.values(DAY_355)) expect(isOn(pixelOfTheSun(sun, framedRadiusOf(RADIUS, true), size), size)).toBe(true);
    }
  });
});

describe("the limits", () => {
  test("near and far are scaled to the roof (fix 9)", () => {
    expect(nearAndFarOf(RADIUS)).toEqual({ near: RADIUS * 0.05, far: RADIUS * 30 });
  });

  test("the orbit may come no nearer than a fifth of the radius and no farther than twelve times it", () => {
    expect(distanceLimitsOf(RADIUS)).toEqual({ min: RADIUS * 0.2, max: RADIUS * 12 });
    expect(distanceLimitsOf(1).min).toBe(2);
  });
});

describe("the plan", () => {
  test("its zoom fits the roof's diameter, with room around it, into the shorter side of the canvas", () => {
    // 2 × 49.24 m with a fifteenth around, into 600 px: pixels per metre.
    expect(planZoomOf(RADIUS, 1200, 600)).toBeCloseTo(600 / (2 * RADIUS * 1.15), 9);
    expect(planZoomOf(RADIUS, 400, 900)).toBeCloseTo(400 / (2 * RADIUS * 1.15), 9);
  });

  test("the zoom may go no nearer than a fifth of the fit and no farther than twelve times it, as the orbit's distances", () => {
    expect(zoomLimitsOf(5)).toEqual({ min: 5 / 12, max: 5 * 5 });
  });
});
