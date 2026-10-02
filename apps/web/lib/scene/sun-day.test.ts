import { describe, expect, test } from "bun:test";
import type { SunDay } from "../stores/results-store";
import { hoursOf, sunAt } from "./sun-day";

// The day of the Pune demo's design day as /sun answers it: a quarter hour apart (plan/phase-06-plan.md,
// decision 1). Positions from the engine (docs/design/mockups/sun_lens_data.json).
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
    { hour: 12, elevationDeg: 48.03, azimuthDeg: 180 },
    { hour: 16, elevationDeg: 17.972, azimuthDeg: 236.642 },
    { hour: 17.25, elevationDeg: 2.482, azimuthDeg: 244.241 },
    { hour: 17.5, elevationDeg: -0.737, azimuthDeg: 245.455 },
  ],
};

describe("the sun of a day at an hour", () => {
  test("is the day's position at that hour", () => {
    expect(sunAt(PUNE_355, 16)).toEqual({ elevationDeg: 17.972, azimuthDeg: 236.642 });
  });

  test("between two positions it lies between them", () => {
    const sun = sunAt(PUNE_355, 6.625);
    expect(sun?.elevationDeg).toBeCloseTo(0.8725, 6);
    expect(sun?.azimuthDeg).toBeCloseTo(115.152, 3);
  });

  test("the azimuth goes the short way round north", () => {
    const north: SunDay = {
      ...PUNE_355,
      positions: [
        { hour: 11.75, elevationDeg: 80, azimuthDeg: 350 },
        { hour: 12.25, elevationDeg: 80, azimuthDeg: 10 },
      ],
    };
    expect(sunAt(north, 12)?.azimuthDeg).toBeCloseTo(0, 9);
  });

  test("outside the hours the day has, there is none", () => {
    expect(sunAt(PUNE_355, 5)).toBeNull();
    expect(sunAt(PUNE_355, 18)).toBeNull();
  });
});

describe("the hours a time may take on a day", () => {
  test("run from sunrise to sunset, to the quarter hour inside them", () => {
    expect(hoursOf(PUNE_355)).toEqual({ from: 6.75, to: 17.25, sky: "rises and sets" });
  });

  test("a sunrise on a quarter hour is that quarter hour", () => {
    expect(hoursOf({ ...PUNE_355, sunriseH: 6.5, sunsetH: 17.5 })).toEqual({ from: 6.5, to: 17.5, sky: "rises and sets" });
  });

  test("a day the sun stays up runs the whole day", () => {
    const up: SunDay = { ...PUNE_355, sunriseH: null, sunsetH: null, positions: [{ hour: 12, elevationDeg: 20, azimuthDeg: 180 }] };
    expect(hoursOf(up)).toEqual({ from: 0, to: 24, sky: "stays up" });
  });

  test("a day the sun stays down runs the whole day too", () => {
    const down: SunDay = { ...PUNE_355, sunriseH: null, sunsetH: null, positions: [{ hour: 12, elevationDeg: -3, azimuthDeg: 180 }] };
    expect(hoursOf(down)).toEqual({ from: 0, to: 24, sky: "stays down" });
  });
});
