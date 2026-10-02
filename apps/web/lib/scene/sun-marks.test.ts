import { describe, expect, test } from "bun:test";
import type { SunDay } from "../stores/results-store";
import { chipPlaceOf, hourMarksOf, marksShownOf } from "./sun-marks";
import { arcOf, pointOnDomeOf } from "./sun-path";

// The hour marks of the sun path (plan/phase-06-plan.md, decision 10; the board "Sun path and shadow
// outlines"): sunrise and sunset on the horizon, the window's ends and noon on the arc, each a chip.
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

describe("the hour marks of a day", () => {
  const marks = hourMarksOf(PUNE_355, WINDOW, CENTRE, RADIUS);
  const arc = arcOf(PUNE_355, WINDOW, CENTRE, RADIUS);

  test("sunrise, the window's start, noon, the window's end and sunset, in the order of the day, in the words of the timeline", () => {
    expect(marks.map(({ role, words }) => [role, words])).toEqual([
      ["sunrise", "06:33 sunrise"],
      ["start", "09:00"],
      ["noon", "12:00"],
      ["end", "16:00"],
      ["sunset", "sunset 17:27"],
    ]);
    expect(marks.map(({ hour }) => hour)).toEqual([6.557, 9, 12, 16, 17.443]);
  });

  test("sunrise and sunset stand on the horizon, at the arc's ends", () => {
    expect(marks[0].at).toEqual(arc.day[0]);
    expect(marks.at(-1)!.at).toEqual(arc.day.at(-1)!);
    expect(marks[0].at[2]).toBeCloseTo(0, 9);
  });

  test("the others stand on the arc where the sun is at their hour", () => {
    expect(marks[1].at).toEqual(pointOnDomeOf({ elevationDeg: 28, azimuthDeg: 133 }, CENTRE, RADIUS));
    expect(marks[2].at).toEqual(pointOnDomeOf({ elevationDeg: 48.03, azimuthDeg: 180 }, CENTRE, RADIUS));
    expect(marks[3].at).toEqual(pointOnDomeOf({ elevationDeg: 17.972, azimuthDeg: 236.642 }, CENTRE, RADIUS));
  });

  test("an end of the window while the sun is down has no mark; noon on an end of the window is that end's alone", () => {
    const early = hourMarksOf(PUNE_355, { from: 5, to: 12 }, CENTRE, RADIUS);
    expect(early.map(({ role }) => role)).toEqual(["sunrise", "end", "sunset"]);
  });

  test("a day the sun stays down has none", () => {
    const down: SunDay = { ...PUNE_355, sunriseH: null, sunsetH: null, positions: PUNE_355.positions.map((p) => ({ ...p, elevationDeg: -10 })) };
    expect(hourMarksOf(down, WINDOW, CENTRE, RADIUS)).toEqual([]);
  });

  test("a day the sun stays up has no sunrise and no sunset", () => {
    const up: SunDay = { ...PUNE_355, sunriseH: null, sunsetH: null, positions: PUNE_355.positions.map((p) => ({ ...p, elevationDeg: Math.abs(p.elevationDeg) + 1 })) };
    expect(hourMarksOf(up, WINDOW, CENTRE, RADIUS).map(({ role }) => role)).toEqual(["start", "noon", "end"]);
  });
});

describe("the marks shown", () => {
  const marks = hourMarksOf(PUNE_355, WINDOW, CENTRE, RADIUS);

  test("the mark at the marker's hour gives way to the marker's callout", () => {
    expect(marksShownOf(marks, 16, true).map(({ role }) => role)).toEqual(["sunrise", "start", "noon", "sunset"]);
  });

  test("without the callout, every mark is shown", () => {
    expect(marksShownOf(marks, 16, false)).toEqual(marks);
  });

  test("at an hour with no mark, every mark is shown", () => {
    expect(marksShownOf(marks, 10.5, true)).toEqual(marks);
  });
});

describe("where a chip stands", () => {
  // The board's places, from the point of the mark: sunrise to the left and above, the window and noon
  // above, the window's end to the right, sunset under.
  test("beside its mark, as the board places each", () => {
    expect(chipPlaceOf("sunrise", 100, 100)).toEqual({ x: 50, y: 84 });
    expect(chipPlaceOf("start", 100, 100)).toEqual({ x: 100, y: 80 });
    expect(chipPlaceOf("noon", 100, 100)).toEqual({ x: 100, y: 80 });
    expect(chipPlaceOf("end", 100, 100)).toEqual({ x: 136, y: 86 });
    expect(chipPlaceOf("sunset", 100, 100)).toEqual({ x: 100, y: 118 });
  });
});
