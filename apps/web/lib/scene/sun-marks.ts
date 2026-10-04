// The hour marks of the sun path (plan/phase-06-plan.md, decision 10; the board "Sun path and shadow
// outlines"): sunrise and sunset on the horizon, the shade-free window's ends and noon on the arc, each a
// chip in the words of the timeline, placed by projection as the stage's labels are. Pure functions in the
// engine's metres; the scene projects the points and the DOM over the stage draws the chips.
import type { SunDay } from "../stores/results-store";
import type { XY, XYZ } from "../geometry/adapter";
import { hourOf } from "../geometry/keepout";
import { sunAt } from "../flow/sun-day";
import { arcOf, pointOnDomeOf } from "./sun-path";

/** What a mark stands for: the day's ends, the window's ends, noon. */
export type MarkRole = "sunrise" | "start" | "noon" | "end" | "sunset";

export type HourMark = { role: MarkRole; hour: number; words: string; at: XYZ };

/** Noon in solar time. */
const NOON = 12;

/**
 * The marks of a day, in its order: sunrise and sunset where the arc meets the horizon, saying the times
 * the engine gives ("06:33 sunrise", "sunset 17:27"); the window's ends and noon where the sun stands at
 * their hour, while it is up. Noon on an end of the window is that end's mark alone.
 */
export function hourMarksOf(day: SunDay, window: { from: number; to: number }, centre: XY, roofRadius: number): HourMark[] {
  const arc = arcOf(day, window, centre, roofRadius).day;
  const between: Array<[MarkRole, number]> = [
    ["start", window.from],
    ["noon", NOON],
    ["end", window.to],
  ];
  const onTheArc = between
    .filter(([role, hour]) => role !== "noon" || (hour !== window.from && hour !== window.to))
    .flatMap(([role, hour]): HourMark[] => {
      const sun = sunAt(day, hour);
      return sun && sun.elevationDeg > 0 ? [{ role, hour, words: hourOf(hour), at: pointOnDomeOf(sun, centre, roofRadius) }] : [];
    })
    .sort((a, b) => a.hour - b.hour);
  const { sunriseH, sunsetH } = day;
  const first = arc[0];
  const last = arc.at(-1);
  if (sunriseH === null || sunsetH === null || !first || !last || arc.length < 2) return onTheArc;
  const sunrise: HourMark = { role: "sunrise", hour: sunriseH, words: `${hourOf(sunriseH)} sunrise`, at: first };
  const sunset: HourMark = { role: "sunset", hour: sunsetH, words: `sunset ${hourOf(sunsetH)}`, at: last };
  return [sunrise, ...onTheArc, sunset];
}

/** The marks shown: the one at the marker's hour gives way to the marker's callout while that is shown. */
export function marksShownOf(marks: readonly HourMark[], hour: number, isCalloutShown: boolean): HourMark[] {
  return isCalloutShown ? marks.filter((mark) => mark.hour !== hour) : [...marks];
}

/**
 * Where a chip stands from the point of its mark, in pixels, as the board places each: sunrise to the left
 * and above, the window's start and noon above, the window's end to the right, sunset under.
 */
const CHIP_OFFSET: Record<MarkRole, readonly [dx: number, dy: number]> = {
  sunrise: [-50, -16],
  start: [0, -20],
  noon: [0, -20],
  end: [36, -14],
  sunset: [0, 18],
};

/** Whether a name is that of a mark: the projected marks carry their role as their name. */
export function isMarkRole(name: string | undefined): name is MarkRole {
  return name !== undefined && Object.hasOwn(CHIP_OFFSET, name);
}

/** The middle of a chip on the canvas, from the pixel its mark falls on. */
export function chipPlaceOf(role: MarkRole, x: number, y: number): { x: number; y: number } {
  const [dx, dy] = CHIP_OFFSET[role];
  return { x: x + dx, y: y + dy };
}

/** The share of the stage's width up to which the marker's callout stands to its right, as the board has it. */
const RIGHT_UP_TO = 0.6;

/** Which side of the marker its callout stands: to the right, as the board has it, unless the stage's right edge would cut it. */
export function calloutSideOf(x: number, width: number): "right" | "left" {
  return x <= width * RIGHT_UP_TO ? "right" : "left";
}

/** Pixels of the stage's top that the title, its line and the view controls take: 20 over them, 44 high, and room. */
export const CLEAR_OF_THE_TOP = 140;

/**
 * Pixels of the stage's bottom that the time and, on desktop, the vitals over the stage take: the panel's 20, the
 * vitals' 78, 18 between, the timeline's 64, and room.
 */
export const CLEAR_OF_THE_BOTTOM = 200;

/** Where the marker's callout stands: beside the marker; under it in the stage's top, over it in the stage's bottom. */
export function calloutRowOf(y: number, height: number): "beside" | "below" | "above" {
  if (y < CLEAR_OF_THE_TOP) return "below";
  if (y > height - CLEAR_OF_THE_BOTTOM) return "above";
  return "beside";
}

/** Whether a point of the stage, in pixels from its top left, lies on the canvas of that size. */
export function isOnTheCanvas({ x, y }: { x: number; y: number }, width: number, height: number): boolean {
  return x >= 0 && y >= 0 && x <= width && y <= height;
}
