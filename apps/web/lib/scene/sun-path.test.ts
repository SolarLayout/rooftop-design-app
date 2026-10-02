import { describe, expect, test } from "bun:test";
import type { SunDay } from "../stores/results-store";
import { DOME, pointOnDomeOf, sunPathOf } from "./sun-path";

// The sun path (plan/phase-06-plan.md, decision 10): the day's positions on a dome about the roof's
// centroid, above the horizon; the shade-free window's part apart; the marker at the view's hour.
const PUNE_355: SunDay = {
  lat: 18.52,
  lon: 73.86,
  day: "design_day",
  dayOfYear: 355,
  sunriseH: 6.557,
  sunsetH: 17.443,
  positions: [
    { hour: 6.5, elevationDeg: -0.737, azimuthDeg: 114.545 },
    { hour: 6.75, elevationDeg: 2.482, azimuthDeg: 115.759 },
    { hour: 9, elevationDeg: 28.0, azimuthDeg: 133.0 },
    { hour: 12, elevationDeg: 48.03, azimuthDeg: 180 },
    { hour: 16, elevationDeg: 17.972, azimuthDeg: 236.642 },
    { hour: 17.25, elevationDeg: 2.482, azimuthDeg: 244.241 },
    { hour: 17.5, elevationDeg: -0.737, azimuthDeg: 245.455 },
  ],
};
const CENTRE = [45, 20] as const;
const RADIUS = 49.24;
const WINDOW = { from: 9, to: 16 };
const near = (a: readonly number[], b: readonly number[], within = 1e-6) => a.every((value, index) => Math.abs(value - b[index]) <= within);

describe("a point on the dome", () => {
  test("lies at the dome's radius from the roof's centroid, toward the sun", () => {
    const [x, y, z] = pointOnDomeOf({ elevationDeg: 17.972, azimuthDeg: 236.642 }, CENTRE, RADIUS);
    expect(Math.hypot(x - 45, y - 20, z)).toBeCloseTo(RADIUS * DOME, 6);
    // In the south-west, low: west and south of the centroid, above the roof.
    expect(x).toBeLessThan(45);
    expect(y).toBeLessThan(20);
    expect(z).toBeCloseTo(RADIUS * DOME * Math.sin((17.972 * Math.PI) / 180), 6);
  });

  test("at noon in December it stands due south", () => {
    const [x, y] = pointOnDomeOf({ elevationDeg: 48.03, azimuthDeg: 180 }, CENTRE, RADIUS);
    expect(x).toBeCloseTo(45, 6);
    expect(y).toBeLessThan(20);
  });
});

describe("the path of a day", () => {
  const path = sunPathOf(PUNE_355, 16, WINDOW, CENTRE, RADIUS);

  test("runs from sunrise to sunset over the horizon, the horizon's points at its ends", () => {
    expect(path.day).toHaveLength(7);
    expect(path.day[0][2]).toBeCloseTo(0, 9);
    expect(path.day.at(-1)![2]).toBeCloseTo(0, 9);
    expect(path.day.slice(1, -1).every(([, , z]) => z > 0)).toBe(true);
  });

  test("the window's part runs from 09:00 to 16:00", () => {
    expect(path.window).toHaveLength(3);
    expect(near(path.window[0], pointOnDomeOf({ elevationDeg: 28, azimuthDeg: 133 }, CENTRE, RADIUS))).toBe(true);
    expect(near(path.window.at(-1)!, pointOnDomeOf({ elevationDeg: 17.972, azimuthDeg: 236.642 }, CENTRE, RADIUS))).toBe(true);
  });

  test("the marker stands at the view's hour", () => {
    expect(near(path.marker!, pointOnDomeOf({ elevationDeg: 17.972, azimuthDeg: 236.642 }, CENTRE, RADIUS))).toBe(true);
  });

  test("no marker while the sun is down", () => {
    expect(sunPathOf(PUNE_355, 6.5, WINDOW, CENTRE, RADIUS).marker).toBeNull();
  });

  test("a day the sun stays down has no path", () => {
    const down: SunDay = { ...PUNE_355, sunriseH: null, sunsetH: null, positions: PUNE_355.positions.map((p) => ({ ...p, elevationDeg: -10 })) };
    expect(sunPathOf(down, 12, WINDOW, CENTRE, RADIUS)).toEqual({ day: [], window: [], marker: null });
  });
});
