// What "Build this roof" sends to the API (decision D43): the corners as drawn, in WGS84, the roof type,
// and the name of the place when the roof was found by words (decision of the plan, 6).
import type { OutlineOnMap, Roof } from "../api";
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

export function buildRequestOf(state: OutlineState, roofType: Roof["roof_type"], foundBy: FoundBy | null): OutlineOnMap | null {
  const outline = cornersOnMap(state);
  if (!outline || !state.frame) return null;
  return {
    outline,
    obstacles: mapShapesOf(state.obstacles, state.frame),
    roof_type: roofType,
    ...(foundBy?.byWords ? { name: foundBy.label } : {}),
  };
}
