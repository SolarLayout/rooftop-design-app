// What the tool in hand draws on Find's map, and how: by a drag (the map's panning off while it can, the crosshair), by
// presses (the crosshair), or nothing (a drag pans the map). Pure; the outline's layer follows it.
import type { Tool } from "./how-to";
import type { OutlineState } from "./outline-state";

export type Draws = "drag" | "press" | null;

/**
 * The rectangle while no corner is placed, and the box, the tank and the tree on the closed roof (not picked up, none
 * awaiting its height), are drawn by a drag; the corners while the roof is open, Detect building, the wall and the
 * building by presses.
 */
export function drawsOf(tool: Tool | null, state: OutlineState): Draws {
  const onTheRoof = state.closed && state.pending === null;
  switch (tool) {
    case "rectangle":
      return state.corners.length === 0 ? "drag" : null;
    case "box":
    case "tank":
    case "tree":
      return onTheRoof && !state.picked ? "drag" : null;
    case "corners":
      return state.closed ? null : "press";
    case "detect":
      return "press";
    case "wall":
    case "building":
      return onTheRoof ? "press" : null;
    case null:
      return null;
  }
}
