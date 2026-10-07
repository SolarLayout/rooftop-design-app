import { describe, expect, test } from "bun:test";
import { mapCursorOf } from "./map-cursor";

// The cursor over Find's map says what a drag does (D79): a closed hand while the map or what is picked is
// dragged, the move cursor over what is picked, the crosshair while a drawing tool needs the press, else an
// open hand: a drag pans the map.

const AT_REST = { draws: false, overPicked: false, dragged: false };

describe("the cursor over the map", () => {
  test("at rest with nothing to draw: an open hand", () => {
    expect(mapCursorOf(AT_REST)).toBe("grab");
  });

  test("a drawing tool in hand: the crosshair", () => {
    expect(mapCursorOf({ ...AT_REST, draws: true })).toBe("crosshair");
  });

  test("over what is picked: the move cursor, whatever the tool", () => {
    expect(mapCursorOf({ ...AT_REST, draws: true, overPicked: true })).toBe("move");
  });

  test("while the map or what is picked is dragged: a closed hand, whatever else", () => {
    expect(mapCursorOf({ draws: true, overPicked: true, dragged: true })).toBe("grabbing");
  });
});
