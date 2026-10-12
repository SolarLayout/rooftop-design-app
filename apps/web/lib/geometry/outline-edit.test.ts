import { describe, expect, test } from "bun:test";
import type { XY } from "./adapter";
import { withCornerMoved } from "./outline-edit";

// The outline edited in the plan (V2 · 7, D103; audit V2-59): a corner dragged on the stage, snapped to 0.1 m; an outline
// that would cross itself, or close to nothing, is refused and the roof stays as it was. Find is for a new roof alone.

const DEMO: XY[] = [
  [0, 0],
  [90, 0],
  [90, 40],
  [0, 40],
];

describe("a corner of the outline moved", () => {
  test("goes where it was dropped, snapped to 0.1 m; the others stay", () => {
    expect(withCornerMoved(DEMO, 2, [95.04, 43.97])).toEqual([
      [0, 0],
      [90, 0],
      [95, 44],
      [0, 40],
    ]);
  });

  test("dropped where it stood, the same outline comes back", () => {
    expect(withCornerMoved(DEMO, 1, [90.02, 0.01])).toBe(DEMO);
  });

  test("an outline that would cross itself is refused", () => {
    expect(withCornerMoved(DEMO, 2, [45, -20])).toBeNull();
  });

  test("an outline that would close to nothing is refused", () => {
    expect(withCornerMoved(DEMO, 2, [0, 0])).toBeNull();
  });
});
