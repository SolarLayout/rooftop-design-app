import { describe, expect, test } from "bun:test";
import { distanceLimitsOf, nearAndFarOf, planZoomOf, presetPositionOf, zoomLimitsOf } from "./camera";

// Where the camera stands for each preset, from the roof's radius (plan decision 17, r3f-notes fixes 9
// and 13). In three's metres: x east, y up, z south.

const RADIUS = 49.24; // the demo roof

describe("the presets", () => {
  test("3D looks at the roof from the south-west, above it", () => {
    const [x, y, z] = presetPositionOf("3d", RADIUS, null);
    expect(x).toBeLessThan(0);
    expect(y).toBeGreaterThan(0);
    expect(z).toBeGreaterThan(0);
    expect(Math.hypot(x, y, z)).toBeGreaterThan(RADIUS * 1.5);
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
