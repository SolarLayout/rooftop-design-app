import { describe, expect, test } from "bun:test";
import { calloutPlaceOf, chipShiftOf, CHIP_ON_PHONE, ROOM_ABOVE, ROOM_ABOVE_ON_PHONE, ROOM_BELOW } from "./callout-place";

// Where the callout of what is selected stands (docs/design/components.md, "Callout on the stage"; the board
// "Obstacle edited on the roof"; plan/phase-06-plan.md, step 15): over its dot, under it where it would rise into
// the stage's top (the title, the view controls, on phone the time); on phone none while an obstacle's handles stand.
describe("the place of the callout", () => {
  test("over its dot, where there is room", () => {
    expect(calloutPlaceOf({ y: 400, size: "desktop", hasHandles: false })).toBe("above");
    expect(calloutPlaceOf({ y: ROOM_ABOVE, size: "tablet", hasHandles: true })).toBe("above");
  });

  test("under it near the stage's top", () => {
    expect(calloutPlaceOf({ y: ROOM_ABOVE - 1, size: "desktop", hasHandles: false })).toBe("below");
    expect(calloutPlaceOf({ y: 90, size: "phone", hasHandles: false })).toBe("below");
  });

  test("on phone, none while the handles of an obstacle stand: they and the time fill the stage's top", () => {
    expect(calloutPlaceOf({ y: 400, size: "phone", hasHandles: true })).toBeNull();
  });

  test("on phone, under its dot where it fits over the legend; over it where it does not and the time leaves room (plan/phase-07-plan.md, step 22)", () => {
    // The board "Strings on the roof", phone: the callout hangs under the dot.
    expect(calloutPlaceOf({ y: 90, size: "phone", hasHandles: false, stageHeight: 252 })).toBe("below");
    // A dot at 152 of 252: under it the callout would run into the legend and the stage's bottom.
    expect(calloutPlaceOf({ y: 152, size: "phone", hasHandles: false, stageHeight: 252 })).toBe("above");
    expect(calloutPlaceOf({ y: 252 - ROOM_BELOW, size: "phone", hasHandles: false, stageHeight: 252 })).toBe("below");
    expect(calloutPlaceOf({ y: ROOM_ABOVE_ON_PHONE - 1, size: "phone", hasHandles: false, stageHeight: 252 })).toBe("below");
  });
});

describe("the chip of a callout held inside the stage on phone (the board \"Strings on the roof\", phone; step 22)", () => {
  test("centred on its dot where it fits; shifted inward, its dot kept, where it would leave the stage", () => {
    expect(chipShiftOf({ x: 195, stageWidth: 390 })).toBe(0);
    // A dot 118 from the left: the chip of 264 would begin at −14; it begins 8 in.
    expect(chipShiftOf({ x: 118, stageWidth: 390 })).toBe(8 + CHIP_ON_PHONE / 2 - 118);
    expect(chipShiftOf({ x: 380, stageWidth: 390 })).toBe(390 - 8 - CHIP_ON_PHONE / 2 - 380);
  });
});
