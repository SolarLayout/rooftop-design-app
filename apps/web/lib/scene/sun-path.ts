// The sun path over the roof (plan/phase-06-plan.md, decision 10): the day's positions from /sun placed on
// a dome about the roof's centroid, from the horizon at sunrise to the horizon at sunset; the part inside
// the shade-free window apart, drawn thicker; the marker at the view's hour. Pure functions in the
// engine's metres; the adapter alone turns them into three's.
import type { SunDay, SunPosition } from "../stores/results-store";
import type { XY, XYZ } from "./adapter";
import type { Sun } from "./camera";
import { sunAt } from "../flow/sun-day";

/** The dome's radius, as a share of the roof's: the arc stands clear of the roof and in the frame of Fit. */
export const DOME = 1.3;

export type SunPath = {
  /** The whole day above the horizon, in the order of the hours. */
  day: XYZ[];
  /** The part inside the shade-free window. */
  window: XYZ[];
  /** Where the sun stands at the view's hour; null while it is down. */
  marker: XYZ | null;
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Where a sun stands on the dome over the roof: east is the sine of its azimuth, north its cosine. */
export function pointOnDomeOf({ elevationDeg, azimuthDeg }: Sun, [cx, cy]: XY, roofRadius: number): XYZ {
  const radius = roofRadius * DOME;
  const elevation = toRadians(elevationDeg);
  const azimuth = toRadians(azimuthDeg);
  return [cx + radius * Math.cos(elevation) * Math.sin(azimuth), cy + radius * Math.cos(elevation) * Math.cos(azimuth), radius * Math.sin(elevation)];
}

/** The point on the horizon between two positions, one above it and one below. */
function onTheHorizon(a: SunPosition, b: SunPosition): Sun {
  const share = a.elevationDeg / (a.elevationDeg - b.elevationDeg);
  const turn = ((((b.azimuthDeg - a.azimuthDeg) % 360) + 540) % 360) - 180;
  return { elevationDeg: 0, azimuthDeg: a.azimuthDeg + turn * share };
}

/** The arc of the day over the roof and the window's part: of the day alone, whatever the hour. */
export function arcOf(day: SunDay, window: { from: number; to: number }, centre: XY, roofRadius: number): Pick<SunPath, "day" | "window"> {
  const on = (sun: Sun) => pointOnDomeOf(sun, centre, roofRadius);
  const { positions } = day;
  const path: XYZ[] = [];
  positions.forEach((position, index) => {
    const before = positions[index - 1];
    const isUp = position.elevationDeg > 0;
    if (before && isUp !== before.elevationDeg > 0) path.push(on(onTheHorizon(before, position)));
    if (isUp) path.push(on(position));
  });
  const inWindow = positions.filter((position) => position.elevationDeg > 0 && position.hour >= window.from && position.hour <= window.to).map(on);
  return { day: path, window: inWindow };
}

/** Where the marker stands on the dome at an hour of the day; null while the sun is down. */
export function markerOf(day: SunDay, hour: number, centre: XY, roofRadius: number): XYZ | null {
  const now = sunAt(day, hour);
  return now && now.elevationDeg > 0 ? pointOnDomeOf(now, centre, roofRadius) : null;
}

/** The path of the day over the roof, the window's part and the marker at the hour. */
export function sunPathOf(day: SunDay, hour: number, window: { from: number; to: number }, centre: XY, roofRadius: number): SunPath {
  return { ...arcOf(day, window, centre, roofRadius), marker: markerOf(day, hour, centre, roofRadius) };
}
