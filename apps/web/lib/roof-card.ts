// The words of the card of the roof in the Roof lens (the boards "Studio, Roof lens" on three sizes and
// "Import with missing heights"): where it is, how it was entered, what it has, its size and the direction
// it faces, and the file it came from. Of the document's metres, which are the API's.
import { shown } from "../components/ui/number-entry";
import type { Roof } from "./api";
import { placeInFull } from "./format/place";
import { areaOf, edgesOf, facingOf, type XY } from "./outline/measure";
import { isRectangle } from "./outline/typed-length";

export type RoofCard = {
  place: string;
  how: string;
  /** The corners and the obstacles: "4 corners · 6 obstacles". */
  count: string;
  size: string;
  /** The name of the drawing the roof was read from; null where it was not. */
  file: string | null;
};

const HOW: Record<Roof["source"], string> = {
  map: "Outlined on satellite",
  coordinates: "Entered by hand",
  kmz: "From a file",
  dxf: "From a file",
};

const FROM_A_FILE = new Set<Roof["source"]>(["kmz", "dxf"]);

/** The card of a roof; `file` is the name of the drawing it was read from (`roof_input.file`). */
export function roofCardOf(roof: Roof, file = ""): RoofCard {
  const corners: XY[] = roof.outline.map(([x, y]) => ({ x, y }));
  const facing = facingOf(corners, roof.lat >= 0 ? "north" : "south");
  const faces = facing ? ` · faces ${Math.round(facing.degrees)}° ${facing.compass}` : "";
  const edges = edgesOf(corners);
  const size = isRectangle(corners)
    ? `${shown(Math.max(edges[0], edges[1]), 1)} × ${shown(Math.min(edges[0], edges[1]), 1)} m`
    : `${shown(Math.round(areaOf(corners)), 0)} m²`;
  const obstacles = roof.obstacles.filter((obstacle) => !obstacle.auto).length;
  const counted = obstacles === 0 ? "" : ` · ${obstacles} ${obstacles === 1 ? "obstacle" : "obstacles"}`;
  return {
    place: placeInFull(roof.lat, roof.lon),
    how: HOW[roof.source],
    count: `${corners.length} corners${counted}`,
    size: `${size}${faces}`,
    file: FROM_A_FILE.has(roof.source) && file !== "" ? file : null,
  };
}
