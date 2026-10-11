// What "Build this roof" sends to the API (decision D43): the corners as drawn, in WGS84, the roof type,
// and the name of the place when the roof was found by words (decision of the plan, 6). A roof built again keeps
// its trees, which the map does not draw (#179, item 1).
import type { MapShapeRequest, OutlineOnMap, Roof } from "../api";
import { toLonLat } from "./frame";
import { mapShapesOf } from "./obstacles";
import type { OutlineState } from "./outline-state";

export type FoundBy = { label: string; byWords: boolean };

/** The corners of a closed outline as (lon, lat), in the order they were drawn; null before it is closed. */
export function cornersOnMap(state: OutlineState): [number, number][] | null {
  if (!state.frame || !state.closed || state.corners.length < 3) return null;
  const frame = state.frame;
  return state.corners.map((corner) => {
    const { lon, lat } = toLonLat(frame, corner);
    return [lon, lat];
  });
}

/** How the roof was entered: outlined on the map, or typed by its measurements ("coordinates", as the desktop app's). */
export type EnteredBy = "map" | "coordinates";

/** The request of "Build this roof"; *trees*, of a roof built again, go after the obstacles of the map, as they came. */
export function buildRequestOf(
  state: OutlineState,
  roofType: Roof["roof_type"],
  foundBy: FoundBy | null,
  source: EnteredBy = "map",
  trees: readonly MapShapeRequest[] = [],
): OutlineOnMap | null {
  const outline = cornersOnMap(state);
  if (!outline || !state.frame) return null;
  return {
    outline,
    obstacles: [...mapShapesOf(state.obstacles, state.frame), ...trees],
    roof_type: roofType,
    source,
    ...(foundBy?.byWords ? { name: foundBy.label } : {}),
  };
}
