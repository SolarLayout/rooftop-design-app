// The heights a drawing could not give (plan/phase-05-plan.md, step 13, decision 13): the engine set them to
// 1.0 m and named the obstacles; the Roof lens says so in the engine's words and selects them one by one
// until each has a real height. The names are the view store's list to review.
import type { Obstacle } from "../api";

/** The engine's note, word for word (rooftop_core.roof_files.HEIGHTS_SET). */
export const HEIGHTS_SET = "These obstacles have no height in the file and were set to 1.0 m.";

/** The hint in the open card of an obstacle whose height is to be reviewed. */
export const REVIEW_HINT = "Enter the real height. The file gave none; 1.0 m stands until you do";

export const toReviewWordsOf = (count: number): string => `${count} to review`;

/** The names of the list that are still on the roof: one removed, or renamed, is no longer to review. */
export function namesToReview(obstacles: readonly Obstacle[], toReview: readonly string[]): string[] {
  return toReview.filter((name) => obstacles.some((obstacle) => obstacle.name === name));
}

/**
 * The index, in the roof's obstacles, of the next one to review: the first of the list, or the one after
 * `after` around the end of the list, `after` itself passed over. Null when there is none.
 */
export function indexToReview(obstacles: readonly Obstacle[], toReview: readonly string[], after?: string): number | null {
  const onTheRoof = namesToReview(obstacles, toReview);
  const from = after === undefined ? -1 : onTheRoof.indexOf(after);
  const next = onTheRoof.map((_, n) => onTheRoof[(from + 1 + n) % onTheRoof.length]).find((name) => name !== after);
  return next === undefined ? null : obstacles.findIndex((obstacle) => obstacle.name === next);
}
