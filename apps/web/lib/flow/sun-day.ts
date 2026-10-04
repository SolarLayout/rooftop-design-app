// The sun of the scene from the day /sun answered (plan/phase-06-plan.md, decision 1): its position at an
// hour of the view, and the hours the time may take. Pure functions; the day is asked once per place and day.
import type { SunDay } from "../stores/results-store";
import type { Sun } from "../scene/camera";

/** The step of the time: the timeline, the keys and play move by it, and /sun answers a day at it. */
export const QUARTER_HOUR = 0.25;

/** Whether the sun rises and sets on the day, or stays up or down the whole of it. */
export type Sky = "rises and sets" | "stays up" | "stays down";

export type DayHours = { from: number; to: number; sky: Sky };

/** The turn from one azimuth to another the short way, in degrees, from −180 to 180. */
const turnOf = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;

/**
 * Where the sun stands at an hour of the day: the day's position at that hour, or between the two around
 * it; null outside the hours the day has.
 */
export function sunAt(day: SunDay, hour: number): Sun | null {
  const after = day.positions.findIndex((position) => position.hour >= hour);
  if (after === -1) return null;
  const next = day.positions[after];
  if (next.hour === hour) return { elevationDeg: next.elevationDeg, azimuthDeg: next.azimuthDeg };
  if (after === 0) return null;
  const before = day.positions[after - 1];
  const share = (hour - before.hour) / (next.hour - before.hour);
  const azimuth = before.azimuthDeg + turnOf(before.azimuthDeg, next.azimuthDeg) * share;
  return {
    elevationDeg: before.elevationDeg + (next.elevationDeg - before.elevationDeg) * share,
    azimuthDeg: ((azimuth % 360) + 360) % 360,
  };
}

/**
 * The hours the time may take on a day: from sunrise to sunset, each taken to the quarter hour inside
 * it; the whole day where the sun stays up or stays down, which its height at noon tells.
 */
export function hoursOf(day: SunDay): DayHours {
  if (day.sunriseH === null || day.sunsetH === null) {
    const noon = sunAt(day, 12) ?? day.positions[Math.floor(day.positions.length / 2)];
    return { from: 0, to: 24, sky: noon && noon.elevationDeg > 0 ? "stays up" : "stays down" };
  }
  return {
    from: Math.ceil(day.sunriseH / QUARTER_HOUR - 1e-9) * QUARTER_HOUR,
    to: Math.floor(day.sunsetH / QUARTER_HOUR + 1e-9) * QUARTER_HOUR,
    sky: "rises and sets",
  };
}
