import { describe, expect, test } from "bun:test";
import { footprintNotePlaceOf, footprintNoteStays, NOTE_GAP } from "./footprint-note";

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

// Issue 238, item 31: the note stood at the press with no fitting, under the column on tablet and past the right edge on a
// phone. It stands below and to the right of the press, on the other side where that side has no room, and never leaves
// the map's visible area (the stage), 8 inside its edges.
describe("where the note of a footprint stands", () => {
  const NOTE = { width: 340, height: 130 };

  test("below and to the right of the press, by the gap, where it has room", () => {
    expect(footprintNotePlaceOf({ at: { x: 200, y: 100 }, size: NOTE, stage: { left: 0, top: 0, width: 1080, height: 790 } })).toEqual({ x: 200 + NOTE_GAP, y: 100 + NOTE_GAP });
  });

  test("above the press where there is no room below it: on tablet the map's foot meets the sheet", () => {
    expect(footprintNotePlaceOf({ at: { x: 200, y: 380 }, size: NOTE, stage: { left: 0, top: 0, width: 834, height: 440 } })).toEqual({ x: 200 + NOTE_GAP, y: 380 - NOTE_GAP - NOTE.height });
  });

  test("to the left of the press where there is no room at its right", () => {
    expect(footprintNotePlaceOf({ at: { x: 700, y: 100 }, size: NOTE, stage: { left: 0, top: 0, width: 834, height: 440 } })).toEqual({ x: 700 - NOTE_GAP - NOTE.width, y: 100 + NOTE_GAP });
  });

  test("on a phone, where it has room on neither side, it is held 8 inside the stage's right edge", () => {
    expect(footprintNotePlaceOf({ at: { x: 195, y: 100 }, size: NOTE, stage: { left: 0, top: 0, width: 390, height: 500 } })).toEqual({ x: 390 - 8 - NOTE.width, y: 100 + NOTE_GAP });
  });

  test("on a stage too short for it either side of the press, it is held inside, its top first", () => {
    expect(footprintNotePlaceOf({ at: { x: 20, y: 90 }, size: NOTE, stage: { left: 0, top: 0, width: 834, height: 200 } })).toEqual({ x: 20 + NOTE_GAP, y: 200 - 8 - NOTE.height });
    expect(footprintNotePlaceOf({ at: { x: 20, y: 90 }, size: NOTE, stage: { left: 0, top: 0, width: 390, height: 120 } }).y).toBe(8);
  });

  test("in the screen's pixels: the press is on the stage, the note floats over the page, so the stage's place is added", () => {
    // A phone: the stage under the top bar, 56 down; a press near the stage's foot puts the note above it.
    expect(footprintNotePlaceOf({ at: { x: 160, y: 262 }, size: { width: 340, height: 188 }, stage: { left: 0, top: 56, width: 390, height: 338 } })).toEqual({ x: 390 - 8 - 340, y: 56 + 262 - NOTE_GAP - 188 });
    // A desktop: the stage at the left, under the top bar.
    expect(footprintNotePlaceOf({ at: { x: 200, y: 100 }, size: NOTE, stage: { left: 0, top: 57, width: 1056, height: 843 } })).toEqual({ x: 200 + NOTE_GAP, y: 57 + 100 + NOTE_GAP });
  });

  test("in whole pixels", () => {
    const { x, y } = footprintNotePlaceOf({ at: { x: 200.4, y: 100.6 }, size: NOTE, stage: { left: 0, top: 0, width: 1080, height: 790 } });
    expect([x, y]).toEqual([Math.round(200.4 + NOTE_GAP), Math.round(100.6 + NOTE_GAP)]);
  });
});
