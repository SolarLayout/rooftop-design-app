import { describe, expect, test } from "bun:test";
import { calloutPlaceOf, ROOM_ABOVE } from "./callout-place";

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
});
