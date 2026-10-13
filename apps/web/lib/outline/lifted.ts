// What the map draws of what is picked on it (D79): the turn handle of the roof or of a box or a building,
// where it stood while it is lifted (dashed), and the label of the move or the turn. Pure; the layer draws it.
import { centroidOf, type XY } from "../geometry/measure";
import { canTurn, footprintOf, obstacleLiftLabelOf } from "./obstacle-move";
import type { Obstacle } from "./obstacles";
import type { Lifted, OutlineState } from "./outline-state";
import { liftLabelOf, turnHandleOf, type Lift } from "./roof-move";

export type Turning = { of: Lifted; foot: XY; handle: XY };

/** The obstacle picked, as it is now and as it stands in the history; null when none is picked. */
function obstaclePicked(state: OutlineState): { now: Obstacle; atRest: Obstacle } | null {
  const now = state.obstacles.find(({ id }) => id === state.selectedObstacle);
  const atRest = state.history.present.obstacles.find(({ id }) => id === state.selectedObstacle);
  return now && atRest ? { now, atRest } : null;
}

/** The turn handle of the roof picked up, or of the box or the building picked; null for anything else. */
export function turnHandleOfPicked(state: OutlineState, metresPerPx: number): Turning | null {
  if (state.picked && state.corners.length >= 3) return { of: "roof", ...turnHandleOf(state.history.present.corners, state.corners, metresPerPx) };
  const picked = obstaclePicked(state);
  if (!picked || !canTurn(picked.now.kind)) return null;
  return { of: picked.now.id, ...turnHandleOf(picked.atRest.points, picked.now.points, metresPerPx) };
}

/** Where what is lifted stood, while it is moved or turned: the roof's corners or the obstacle's footprint. */
export function ghostOf(state: OutlineState): { points: readonly XY[]; closed: boolean } | null {
  const { lift } = state;
  if (!lift) return null;
  if (lift.of === "roof") return { points: state.history.present.corners, closed: true };
  const atRest = state.history.present.obstacles.find(({ id }) => id === lift.of);
  return atRest ? { points: footprintOf(atRest), closed: atRest.kind !== "wall" } : null;
}

/** The middle of an obstacle's move label stands this many pixels under its lowest point, so that it hides nothing of it. */
const MOVE_LABEL_UNDER_PX = 28;

/** The label of a lift and where it stands: a roof's move at its middle, an obstacle's under it, a turn's at the handle. */
export function liftLabelPlaceOf(state: OutlineState, metresPerPx: number): { at: XY; text: string; kind: Lift["kind"] } | null {
  const { lift, frame } = state;
  if (!lift) return null;
  const handle = lift.kind === "turn" ? (turnHandleOfPicked(state, metresPerPx)?.handle ?? null) : null;
  if (lift.of === "roof") {
    const hemisphere = (frame?.centre.lat ?? 0) >= 0 ? "north" : "south";
    return { at: handle ?? centroidOf(state.corners), text: liftLabelOf(lift, state.corners, hemisphere), kind: lift.kind };
  }
  const obstacle = state.obstacles.find(({ id }) => id === lift.of);
  if (!obstacle) return null;
  const footprint = footprintOf(obstacle);
  const under = { x: centroidOf(footprint).x, y: Math.min(...footprint.map(({ y }) => y)) - MOVE_LABEL_UNDER_PX * metresPerPx };
  return { at: handle ?? under, text: obstacleLiftLabelOf(obstacle, lift), kind: lift.kind };
}
