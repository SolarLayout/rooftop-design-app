import { describe, expect, test } from "bun:test";
import type { Obstacle } from "../api";
import { HEIGHTS_SET, indexToReview, namesToReview, REVIEW_HINT, toReviewWordsOf } from "./review-heights";

// The heights a drawing could not give (plan/phase-05-plan.md, step 13, decision 13; the board "Import with
// missing heights"): the engine's sentence, the count, the hint of the open card, and which obstacle Review
// and Next select.

const named = (name: string) => ({ name, auto: false }) as Obstacle;
const OBSTACLES = ["Lift shaft", "Plant room", "Skylight", "Vent"].map(named);

describe("the words", () => {
  test("the note over them: what the file lacked, and the height the app uses", () => {
    expect(HEIGHTS_SET).toBe("The file has no height for these obstacles. The app uses 1.0 m.");
  });

  test("how many are to review", () => {
    expect(toReviewWordsOf(3)).toBe("3 to review");
    expect(toReviewWordsOf(1)).toBe("1 to review");
  });

  test("the hint of the open card", () => {
    expect(REVIEW_HINT).toBe("Not in the file. Enter the real height.");
  });
});

describe("which obstacle is to review next", () => {
  const toReview = ["Lift shaft", "Plant room", "Skylight"];

  test("Review takes the first of the list that is on the roof", () => {
    expect(indexToReview(OBSTACLES, toReview)).toBe(0);
    expect(indexToReview(OBSTACLES, ["Plant room", "Skylight"])).toBe(1);
  });

  test("Next takes the one after the named, around the end of the list", () => {
    expect(indexToReview(OBSTACLES, toReview, "Lift shaft")).toBe(1);
    expect(indexToReview(OBSTACLES, toReview, "Skylight")).toBe(0);
  });

  test("the named one itself is passed over, even when it is the only one left besides none", () => {
    expect(indexToReview(OBSTACLES, ["Plant room"], "Plant room")).toBeNull();
  });

  test("the names still on the roof are what is counted", () => {
    expect(namesToReview(OBSTACLES, ["Gone", "Skylight", "Vent"])).toEqual(["Skylight", "Vent"]);
  });

  test("a name that is no longer on the roof is passed over; nothing to review is null", () => {
    expect(indexToReview(OBSTACLES, ["Gone", "Skylight"])).toBe(2);
    expect(indexToReview(OBSTACLES, [])).toBeNull();
  });
});
