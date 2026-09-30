// The words of the card of the roof in the Roof lens (the board "Studio, Roof lens"): where it is, how
// it was entered, its size and the direction it faces. Of the document's metres, which are the API's.
import { shown } from "../components/ui/number-entry";
import type { Roof } from "./api";
import { placeInFull } from "./format/place";
import { areaOf, edgesOf, facingOf, type XY } from "./outline/measure";
import { isRectangle } from "./outline/typed-length";

export type RoofCard = { place: string; how: string; size: string };

const HOW: Record<Roof["source"], string> = {
  map: "Outlined on satellite",
  coordinates: "Entered by hand",
  kmz: "From a file",
  dxf: "From a file",
};

export function roofCardOf(roof: Roof): RoofCard {
  const corners: XY[] = roof.outline.map(([x, y]) => ({ x, y }));
  const facing = facingOf(corners, roof.lat >= 0 ? "north" : "south");
  const faces = facing ? ` · faces ${Math.round(facing.degrees)}° ${facing.compass}` : "";
  const edges = edgesOf(corners);
  const size = isRectangle(corners)
    ? `${shown(Math.max(edges[0], edges[1]), 1)} × ${shown(Math.min(edges[0], edges[1]), 1)} m`
    : `${shown(Math.round(areaOf(corners)), 0)} m²`;
  return {
    place: placeInFull(roof.lat, roof.lon),
    how: `${HOW[roof.source]} · ${corners.length} corners`,
    size: `${size}${faces}`,
  };
}
