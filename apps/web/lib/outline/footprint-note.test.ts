import { describe, expect, test } from "bun:test";
import { footprintNoteStays } from "./footprint-note";

// The note of a footprint found by Detect building (issue 238, item 5): the press takes the footprint as the outline at
// once, so the note's button is Undo. It stays while the outline is still the footprint taken, so that its Undo takes
// back the footprint and nothing after it.

const TAKEN = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 8 },
  { x: 0, y: 8 },
];

describe("the note of a footprint", () => {
  test("stays while the outline is the footprint taken", () => {
    expect(footprintNoteStays(TAKEN, TAKEN)).toBe(true);
    expect(footprintNoteStays(TAKEN, TAKEN.map(({ x, y }) => ({ x, y })))).toBe(true);
  });

  test("goes once a corner moves, the footprint is undone, or the outline is cleared", () => {
    expect(footprintNoteStays(TAKEN, [{ x: 0.5, y: 0 }, ...TAKEN.slice(1)])).toBe(false);
    expect(footprintNoteStays(TAKEN, [])).toBe(false);
    expect(footprintNoteStays(TAKEN, TAKEN.slice(0, 3))).toBe(false);
  });

  test("where nothing was found, the note stays until it is closed", () => {
    expect(footprintNoteStays(null, [])).toBe(true);
    expect(footprintNoteStays(null, TAKEN)).toBe(true);
  });
});
