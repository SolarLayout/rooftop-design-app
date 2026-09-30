// The building footprints of Overture Maps, for "Detect building" (decision D13; plan/phase-04-plan.md,
// decisions 11 and 12). A release is pinned: old ones disappear. The tiles end at zoom 14, so a building
// cut by a tile edge is proposed as the piece under the press.
import type { Geometry, Position } from "geojson";
import { frameAt, toMetres, type Frame, type LonLat } from "../outline/frame";
import { areaOf, type XY } from "../outline/measure";

export const OVERTURE_RELEASE = "2026-09-23.1";
export const FOOTPRINTS_URL = `https://tiles.overturemaps.org/${OVERTURE_RELEASE}/buildings.pmtiles`;
/** The layer of the tiles that holds the buildings. */
export const FOOTPRINTS_LAYER = "building";
export const FOOTPRINTS_ZOOM = 14;
/** What ODbL asks to be shown with the footprints. */
export const FOOTPRINTS_ATTRIBUTION = "© Overture Maps Foundation, ODbL";
/** How coarse the footprints are, as the UI says it. */
export const FOOTPRINTS_QUANTISED_M = 0.6;

/** The ring of a footprint, without its closing point, as (lon, lat). */
export function ringOf(geometry: Geometry): Position[] | null {
  const rings: Position[][] =
    geometry.type === "Polygon" ? [geometry.coordinates[0] ?? []] : geometry.type === "MultiPolygon" ? geometry.coordinates.map((polygon) => polygon[0] ?? []) : [];
  const open = rings.map((ring) => (ring.length > 1 && isSame(ring[0], ring[ring.length - 1]) ? ring.slice(0, -1) : ring)).filter((ring) => ring.length >= 3);
  if (open.length === 0) return null;
  // Of a building in pieces, the largest.
  return open.reduce((largest, ring) => (areaOfRing(ring) > areaOfRing(largest) ? ring : largest));
}

/** The footprint as the corners of an outline: metres in a frame at its centre. */
export function footprintOutline(geometry: Geometry): { frame: Frame; corners: XY[] } | null {
  const ring = ringOf(geometry);
  if (!ring) return null;
  const centre = centreOf(ring);
  const frame = frameAt(centre);
  return { frame, corners: ring.map(([lon, lat]) => toMetres(frame, { lon, lat })) };
}

function isSame(a: Position, b: Position): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function areaOfRing(ring: Position[]): number {
  return areaOf(ring.map(([x, y]) => ({ x, y })));
}

function centreOf(ring: Position[]): LonLat {
  const lon = ring.reduce((sum, [x]) => sum + x, 0) / ring.length;
  const lat = ring.reduce((sum, [, y]) => sum + y, 0) / ring.length;
  return { lon, lat };
}
