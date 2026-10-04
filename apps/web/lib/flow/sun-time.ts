// The words of the time of the sun (plan/phase-06-plan.md, decision 3): the date of a day of the year,
// the bearing of the sun, the read-out of the stage. Solar time throughout, as the engine's.
import { shown } from "../../components/ui/number-entry";
import type { Sun } from "../scene/camera";
import { hourOf, type Callout } from "../geometry/keepout";
import { hoursOf, QUARTER_HOUR, type DayHours } from "./sun-day";
import type { SunDay } from "../stores/results-store";
import type { SunTime } from "../stores/view-store";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The length of each month in a year of 365 days: the engine's declination knows no leap year. */
const DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** The date of a day of the year, short ("21 Dec") and long ("21 December"). Day 366 is the last day. */
export function dateOf(dayOfYear: number): { short: string; long: string } {
  const { day, month } = partsOf(dayOfYear);
  const name = MONTHS[month - 1];
  return { short: `${day} ${name.slice(0, 3)}`, long: `${day} ${name}` };
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

/**
 * A mark under the timeline: where it stands on the track, in hours, and what it says. Sunrise and sunset
 * say their time and their word apart too, for where they stand beside the track (tablet).
 */
export type Tick = { hour: number; words: string; end?: { clock: string; word: "sunrise" | "sunset" } };

/**
 * The ticks of the timeline (docs/design/components.md, "Timeline (Sun lens)"): sunrise and sunset at the
 * ends of the track, saying the times the engine gives; the ends of the shade-free window and noon between,
 * where the day has them. A day the sun stays up or down runs from midnight to midnight.
 */
export function ticksOf(hours: DayHours, { sunriseH, sunsetH }: Pick<SunDay, "sunriseH" | "sunsetH">, window: { from: number; to: number }): Tick[] {
  const inside = [window.from, 12, window.to].filter((hour) => hour > hours.from && hour < hours.to).sort((a, b) => a - b);
  const between = [...new Set(inside)].map((hour) => ({ hour, words: hourOf(hour) }));
  if (sunriseH === null || sunsetH === null) return [{ hour: 0, words: "00:00" }, ...between, { hour: 24, words: "24:00" }];
  const rise = hourOf(sunriseH);
  const set = hourOf(sunsetH);
  return [
    { hour: hours.from, words: `${rise} sunrise`, end: { clock: rise, word: "sunrise" } },
    ...between,
    { hour: hours.to, words: `sunset ${set}`, end: { clock: set, word: "sunset" } },
  ];
}

/** An hour taken to the nearest quarter hour and held inside the hours of the day. */
export function heldHourOf(hour: number, hours: DayHours): number {
  const quarter = Math.round(hour / QUARTER_HOUR) * QUARTER_HOUR;
  return Math.min(hours.to, Math.max(hours.from, quarter));
}

/** The winter solstice of the hemisphere: the engine's design day when the array has none of its own. */
const solsticeOf = (lat: number) => (lat >= 0 ? 355 : 172);

/** The design day of an array: its own, or the winter solstice of its hemisphere. */
export const designDayOfYear = (designDoy: number | null, lat: number) => designDoy ?? solsticeOf(lat);

/** A day to choose in the Sun lens, and whether it is the design day. */
export type DayChoice = { label: string; dayOfYear: number; isDesignDay: boolean };

const CHOICES = [355, 80, 172];

/** The days of the Day control (decision 2): the solstices and the equinox, the design day marked. */
export function daysOf(designDoy: number | null, lat: number): DayChoice[] {
  const design = designDayOfYear(designDoy, lat);
  return CHOICES.map((dayOfYear) => ({ label: dateOf(dayOfYear).short, dayOfYear, isDesignDay: dayOfYear === design }));
}

/** The line under the Day control: which day is the design day, and why. */
export function designDayLineOf(designDoy: number | null, lat: number): string {
  const { long } = dateOf(designDayOfYear(designDoy, lat));
  return designDoy === null ? `${long} is the design day: the winter solstice for this hemisphere` : `${long} is the design day of the array`;
}

/** The day of the view that a chosen day sets: the design day as such, so that it follows the array's. */
export function dayOfChoice(dayOfYear: number, designDoy: number | null, lat: number): SunTime["day"] {
  return dayOfYear === designDayOfYear(designDoy, lat) ? "design_day" : dayOfYear;
}

/** The day of the year of a day of a month (from 1); a day past the month's end is its last. */
export function dayOfYearOf(day: number, month: number): number {
  const before = DAYS_IN.slice(0, month - 1).reduce((sum, days) => sum + days, 0);
  return before + Math.min(Math.max(1, day), DAYS_IN[month - 1]);
}

/** The day and the month (from 1) of a day of the year. */
export function partsOf(dayOfYear: number): { day: number; month: number } {
  let left = Math.min(Math.max(1, dayOfYear), 365);
  let month = 0;
  while (left > DAYS_IN[month]) {
    left -= DAYS_IN[month];
    month += 1;
  }
  return { day: left, month: month + 1 };
}

const DAYS_IN_YEAR = 365;

/**
 * The time a key of the Studio gives (decision 17): `,` and `.` an hour back and forward, held to the
 * day; `[` and `]` a day back and forward, round the year. Null for any other key.
 */
export function timeOfKey(key: string, time: SunTime, dayOfYear: number, hours: DayHours): SunTime | null {
  if (key === "," || key === ".") return { day: time.day, hour: heldHourOf(time.hour + (key === "," ? -1 : 1), hours) };
  if (key === "[" || key === "]") {
    const next = dayOfYear + (key === "[" ? -1 : 1);
    return { day: next < 1 ? DAYS_IN_YEAR : next > DAYS_IN_YEAR ? 1 : next, hour: time.hour };
  }
  return null;
}

type Shown = { value: string; unit: string };

/** The tiles of "Sun at": its height and its bearing, each a number and what follows it; null while it is down. */
export function sunAtOf(sun: Sun | null): { height: Shown; bearing: Shown } | null {
  if (sun === null || sun.elevationDeg <= 0) return null;
  const words = bearingOf(sun.azimuthDeg);
  const [number, ...rest] = words.split("°");
  const bearing = rest.length ? { value: number, unit: `°${rest.join("°")}` } : { value: words, unit: "" };
  return { height: { value: shown(sun.elevationDeg, 1), unit: "°" }, bearing };
}

/** What a day is to the sun at a latitude: the solstices by hemisphere, the equinoxes; null for any other. */
function whatTheDayIs(dayOfYear: number, lat: number): string | null {
  if (dayOfYear === 355) return lat >= 0 ? "winter solstice" : "summer solstice";
  if (dayOfYear === 172) return lat >= 0 ? "summer solstice" : "winter solstice";
  if (dayOfYear === 80 || dayOfYear === 266) return "equinox";
  return null;
}

/** The line under the Sun lens's title: "21 December · winter solstice · shade-free from 09:00 to 16:00". */
export function sunLineOf(dayOfYear: number, lat: number, window: { from: number; to: number }): string {
  const what = whatTheDayIs(dayOfYear, lat);
  return [dateOf(dayOfYear).long, what, `shade-free from ${hourOf(window.from)} to ${hourOf(window.to)}`].filter(Boolean).join(" · ");
}

/**
 * The callout of the sun's marker (the board "Studio, Sun lens"): the time, with which end of the
 * shade-free window it is at either; the sun's height and bearing. Null while the sun is down.
 */
export function sunCalloutOf(hour: number, sun: Sun | null, window: { from: number; to: number }): Callout | null {
  if (sun === null || sun.elevationDeg <= 0) return null;
  const clock = hourOf(hour);
  const title = hour === window.to ? `${clock} · end of the shade-free window` : hour === window.from ? `${clock} · start of the shade-free window` : clock;
  return { title, detail: `Sun ${shown(sun.elevationDeg, 1)}° high, ${bearingOf(sun.azimuthDeg)}` };
}

/**
 * The words of the sun path the stage draws: the day from sunrise to sunset, and the window's part when it
 * is drawn thicker. A day the sun stays up runs the whole day; one it stays down has no path: null.
 */
export function sunPathLineOf(day: SunDay, window: { from: number; to: number } | null): string | null {
  const { sky } = hoursOf(day);
  if (sky === "stays down") return null;
  const of = `Sun path of ${dateOf(day.dayOfYear).short}`;
  const path = day.sunriseH === null || day.sunsetH === null ? `${of}, the sun up the whole day` : `${of} from ${hourOf(day.sunriseH)} to ${hourOf(day.sunsetH)}`;
  return window ? `${path}, the shade-free window from ${hourOf(window.from)} to ${hourOf(window.to)} thicker` : path;
}
