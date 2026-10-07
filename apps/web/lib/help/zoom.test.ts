import { describe, expect, test } from "bun:test";
import { fitted, MOST_ZOOM, panned, pinched } from "./zoom";

// A how-to's picture opened large on touch (D81): pinched and moved with the fingers, never smaller than the screen's width,
// never left with a gap at an edge it could cover.

const FRAME = { width: 400, height: 800 };
const PICTURE = { width: 1000, height: 500 }; // shown 400 by 200 at its first scale

describe("a picture opened large", () => {
  test("fits the frame's width, in the middle of its height", () => {
    expect(fitted(FRAME, PICTURE)).toEqual({ scale: 1, x: 0, y: 300 });
  });

  test("pinched open twice as wide about the middle, keeps the middle where it was", () => {
    const view = pinched(fitted(FRAME, PICTURE), [{ x: 150, y: 400 }, { x: 250, y: 400 }], [{ x: 100, y: 400 }, { x: 300, y: 400 }], FRAME, PICTURE);
    expect(view.scale).toBe(2);
    expect(view.x).toBe(-200);
    expect(view.y).toBe(200);
  });

  test("is never smaller than the frame's width, nor larger than three times", () => {
    const start = fitted(FRAME, PICTURE);
    expect(pinched(start, [{ x: 100, y: 400 }, { x: 300, y: 400 }], [{ x: 190, y: 400 }, { x: 210, y: 400 }], FRAME, PICTURE).scale).toBe(1);
    expect(pinched(start, [{ x: 190, y: 400 }, { x: 210, y: 400 }], [{ x: 0, y: 400 }, { x: 400, y: 400 }], FRAME, PICTURE).scale).toBe(MOST_ZOOM);
  });

  test("moved, stops at its edges where it is larger than the frame, and stays in the middle where it is not", () => {
    const large = { scale: 2, x: -200, y: 200 };
    expect(panned(large, { x: 500, y: 0 }, FRAME, PICTURE)).toEqual({ scale: 2, x: 0, y: 200 });
    expect(panned(large, { x: -500, y: 0 }, FRAME, PICTURE)).toEqual({ scale: 2, x: -400, y: 200 });
    expect(panned(large, { x: 0, y: 300 }, FRAME, PICTURE)).toEqual({ scale: 2, x: -200, y: 200 });
  });
});
