// The clips of the how-tos (Phase 15; D82 to D84; docs/help-content.md, "Clips"): the hand's moves at a pace that can be
// followed, recorded a frame at a time by e2e/help-clips (`bun help:clips`). Pure: the pace, the pointer's path, a clip's
// length. A how-to's clips are written beside its pictures, in tools/help/pictures.ts.
import type { Act, Place, Point } from "./pictures";

/** Frames a second: steady, as each frame is taken after a step of the hand. */
export const FPS = 30;

/** How long each part of a move takes, in seconds: slow enough to follow, quick enough not to bore. */
export const PACE = { glide: 0.7, settle: 0.25, press: 0.15, drag: 0.9, hold: 0.6, turn: 1.0 } as const;

/**
 * What the hand does in a clip, each at the pace above, the pointer drawn where it is:
 * - `rest`: nothing, for so many seconds;
 * - `click`: the pointer glides to a place, presses and lets go;
 * - `drag`: glides to a place, presses, drags by so many pixels, holds, and (`back`) drags back before letting go;
 * - `draw`: glides to a place, presses, drags to another and lets go (a rectangle drawn);
 * - `turn`: glides to a handle, by its name, presses, turns round the roof's middle or the obstacle picked, holds, and
 *   (`back`) turns back before letting go.
 * Going back makes the clip's loop seamless: it ends as it began. A clip that draws something ends with it drawn, and its
 * loop begins again from the map as it was.
 */
export type ClipAct =
  | { kind: "rest"; seconds: number }
  | { kind: "click"; at: Place }
  | { kind: "drag"; from: Place; by: Point; back: boolean }
  | { kind: "draw"; from: Place; to: Place }
  | { kind: "turn"; handle: string; degrees: number; back: boolean; around?: "roof" | "obstacle" };

/**
 * A clip of a step, named for the step whose picture it plays in (its poster): `before` puts the map where the step begins,
 * done unseen with the pictures' acts; `acts` are recorded.
 */
export type ClipSpec = { name: string; before: readonly Act[]; acts: readonly ClipAct[] };

export const framesOf = (seconds: number): number => Math.max(1, Math.round(seconds * FPS));

/** Ease in and out: a hand starts slowly, moves, and slows as it arrives. */
export const eased = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** The pointer's places over a glide of so many frames, eased, the last where it goes. */
export function glidePath(from: Point, to: Point, frames: number): Point[] {
  return Array.from({ length: frames }, (_, index) => {
    const t = eased((index + 1) / frames);
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  });
}

/** A clip's length as the step shows it ("0:04"), whole seconds rounded up. */
export function lengthOf(frames: number): string {
  const seconds = Math.ceil(frames / FPS);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
