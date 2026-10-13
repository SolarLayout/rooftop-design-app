import { describe, expect, test } from "bun:test";
import { followsOf } from "./held";

// What of the outline's handles and labels follows the state while one of them is held (issue 238, item 28). A corner
// held is the drag's own, and a midpoint dragged makes a corner, so that the handles are made anew: nothing is redrawn
// under the hand. The handle that turns a rectangle is the drag's too, but the corners and the edges' lengths follow the
// turn as it is made.

describe("what follows while a handle is held", () => {
  test("nothing held: everything follows", () => {
    expect(followsOf(null)).toEqual({ handles: true, turnHandle: true });
  });

  test("a corner held: nothing is redrawn under the hand", () => {
    expect(followsOf("corner")).toEqual({ handles: false, turnHandle: false });
  });

  test("the rectangle turned: its corners and its edges' lengths follow, its handle is the hand's", () => {
    expect(followsOf("turn")).toEqual({ handles: true, turnHandle: false });
  });
});
