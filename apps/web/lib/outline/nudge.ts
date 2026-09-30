// A selected corner nudged by the arrows: 0.1 m, a metre with Shift.
import { NUDGE_MM, NUDGE_SHIFT_MM } from "../../components/ui/design-numbers";
import type { XY } from "./measure";

export type Nudge = { dx: number; dy: number };

const DIRECTION: Record<string, Nudge> = {
  ArrowRight: { dx: 1, dy: 0 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowUp: { dx: 0, dy: 1 },
  ArrowDown: { dx: 0, dy: -1 },
};

/** What a key nudges by, in metres; null for a key that is no arrow. */
export function nudgeOfKey(key: string, shift: boolean): Nudge | null {
  const direction = DIRECTION[key];
  if (!direction) return null;
  const step = (shift ? NUDGE_SHIFT_MM : NUDGE_MM) / 1000;
  return { dx: direction.dx * step, dy: direction.dy * step };
}

/** The outline with corner `index` moved by `nudge`. The same outline when there is no such corner. */
export function nudged(points: readonly XY[], index: number, nudge: Nudge): readonly XY[] {
  if (index < 0 || index >= points.length) return points;
  return points.map((point, at) => (at === index ? { x: point.x + nudge.dx, y: point.y + nudge.dy } : point));
}
