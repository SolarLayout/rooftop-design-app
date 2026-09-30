// Where a design is, as it is shown (docs/design/guidelines.md, "Numbers and units").
import { shown, withUnit } from "../../components/ui/number-entry";

const DEGREES = "°";

function angle(degrees: number, decimals: number, positive: string, negative: string): string {
  const size = shown(Math.abs(degrees), decimals);
  const isNegative = degrees < 0 && Number(size) !== 0;
  return `${withUnit(size, DEGREES)} ${isNegative ? negative : positive}`;
}

/** Beside the name of a design in the top bar: two decimals, as the approved mockups have it. */
export function placeInShort(latitude: number, longitude: number): string {
  return `${angle(latitude, 2, "N", "S")} · ${angle(longitude, 2, "E", "W")}`;
}

/** Where a roof is, in full: five decimals with N, S, E and W, as the search shows what was typed. */
export function placeInFull(latitude: number, longitude: number): string {
  return `${angle(latitude, 5, "N", "S")}, ${angle(longitude, 5, "E", "W")}`;
}
