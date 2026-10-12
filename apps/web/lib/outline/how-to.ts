// The how-to of what the hand can do now on Find's map (D81): the ? beside the panel's title opens it. Pure; Find opens
// the first of these that has a topic (find.tool.<how-to>).
import type { OutlineState } from "./outline-state";

/** The tools of Find's column: three ways to outline while the roof is open, the obstacles once it is closed. */
export type Tool = "corners" | "rectangle" | "detect" | "box" | "tank" | "wall" | "tree" | "building";

export type HowTo = Tool | "move-the-roof" | "move-an-obstacle";

/** The how-tos of what the hand can do now, the most fitting first. */
export function howTosOf(state: OutlineState, tool: Tool): HowTo[] {
  if (!state.closed) return [tool];
  if (state.selectedObstacle !== null) return ["move-an-obstacle", "move-the-roof"];
  if (state.picked) return ["move-the-roof"];
  return [tool, "move-the-roof"];
}
