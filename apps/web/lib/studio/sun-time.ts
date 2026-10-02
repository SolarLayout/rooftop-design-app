// The words of the time of the sun (plan/phase-06-plan.md, decision 3): the date of a day of the year,
// the bearing of the sun, the read-out of the stage. Solar time throughout, as the engine's.
import { shown } from "../../components/ui/number-entry";
import type { Sun } from "../scene/camera";
import { hourOf } from "../scene/keepout";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The length of each month in a year of 365 days: the engine's declination knows no leap year. */
const DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** The date of a day of the year, short ("21 Dec") and long ("21 December"). Day 366 is the last day. */
export function dateOf(dayOfYear: number): { short: string; long: string } {
  let left = Math.min(dayOfYear, 365);
  let month = 0;
  while (left > DAYS_IN[month]) {
    left -= DAYS_IN[month];
    month += 1;
  }
  return { short: `${left} ${MONTHS[month].slice(0, 3)}`, long: `${left} ${MONTHS[month]}` };
}

/** Where the sun stands from the nearer of south and north: "56.6° W of south"; "due south" on the line. */
export function bearingOf(azimuthDeg: number): string {
  const azimuth = ((azimuthDeg % 360) + 360) % 360;
  // West of south and east of north are clockwise.
  const fromSouth = azimuth - 180;
  const fromNorth = azimuth > 180 ? azimuth - 360 : azimuth;
  const isSouth = Math.abs(fromSouth) <= 90;
  const off = isSouth ? fromSouth : fromNorth;
  const degrees = shown(Math.abs(off), 1);
  if (degrees === shown(90, 1)) return azimuth < 180 ? "due east" : "due west";
  if (degrees === shown(0, 1)) return isSouth ? "due south" : "due north";
  const side = isSouth === off > 0 ? "W" : "E";
  return `${degrees}° ${side} of ${isSouth ? "south" : "north"}`;
}

/** The read-out of the time: "21 Dec, 16:00 solar time, sun 18.0° high, 56.6° W of south". */
export function readOutOf(dayOfYear: number, hour: number, sun: Sun | null): string {
  const when = `${dateOf(dayOfYear).short}, ${hourOf(hour)} solar time`;
  if (sun === null || sun.elevationDeg <= 0) return `${when}, the sun is down`;
  return `${when}, sun ${shown(sun.elevationDeg, 1)}° high, ${bearingOf(sun.azimuthDeg)}`;
}
