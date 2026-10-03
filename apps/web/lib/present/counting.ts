// The energy counting up in the last scene of Present (plan/phase-10-plan.md, step 19, decision 9): the value at a
// share of the count, eased out so that the number slows as it lands on the run's figure; the chain's bars of the
// cascade (lib/format/cascade.ts) growing one after another with the same share. Pure.
import type { Mark } from "../format/cascade";

const clamp = (share: number) => Math.min(1, Math.max(0, share));

/** Fast at first, at rest at the end: 1 − (1 − s)³. */
export function easeOut(share: number): number {
  const left = 1 - clamp(share);
  return 1 - left * left * left;
}

/** The number shown at a share of the count, from 0 to `target`. */
export function countedAt(target: number, share: number): number {
  return target * easeOut(share);
}

/**
 * The marks of the chain at a share of its growth: the markers stand, each bar grows from its start over its own part
 * of the share, the first bar first, so that the chain cascades.
 */
export function grownMarksOf(marks: readonly Mark[], share: number): Mark[] {
  const bars = marks.filter((mark) => mark.kind === "bar").length;
  let index = 0;
  return marks.map((mark) => {
    if (mark.kind !== "bar") return mark;
    const own = clamp((clamp(share) - index / bars) * bars);
    index += 1;
    return { ...mark, to: mark.from + (mark.to - mark.from) * own };
  });
}
