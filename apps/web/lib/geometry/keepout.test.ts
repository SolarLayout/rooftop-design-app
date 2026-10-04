import { describe, expect, test } from "bun:test";
import type { Keepout } from "../api";
import { anchorOf, calloutOf, hourOf } from "./keepout";

// The words of a kept-clear area (the board "Studio, Array lens": "Kept clear · 21 positions", "Stair room
// shades this area between 09:00 and 16:00"), of a part of /layout's keep-out and the shade-free window.

const STAIR_ROOM: Keepout = { cause: "obstacle", obstacle: "Stair room", obstacle_index: 0, positions: 18, polygons: [] };
const PARAPET: Keepout = { cause: "parapet", obstacle: null, obstacle_index: null, positions: 12, polygons: [] };
const WINDOW = { from: 9, to: 16, allowShaded: false };

describe("the callout of a kept-clear area", () => {
  test("names the obstacle, the count and the window", () => {
    expect(calloutOf(STAIR_ROOM, WINDOW)).toEqual({ title: "Kept clear · 18 positions", detail: "Stair room shades this area between 09:00 and 16:00" });
  });

  test("the parapet is named as such", () => {
    expect(calloutOf(PARAPET, WINDOW).detail).toBe("The parapet shades this area between 09:00 and 16:00");
  });

  test("one position is singular; none says so", () => {
    expect(calloutOf({ ...STAIR_ROOM, positions: 1 }, WINDOW).title).toBe("Kept clear · 1 position");
    expect(calloutOf({ ...STAIR_ROOM, positions: 0 }, WINDOW).title).toBe("Kept clear · no whole position");
  });

  test("with shaded positions allowed the area is used and the words say so", () => {
    expect(calloutOf(STAIR_ROOM, { ...WINDOW, allowShaded: true }).title).toBe("Shaded in the window · 18 positions");
  });

  test("a quarter hour is written as minutes", () => {
    expect(hourOf(9.25)).toBe("09:15");
    expect(hourOf(16)).toBe("16:00");
    expect(hourOf(5.5)).toBe("05:30");
  });
});

describe("where the callout of a part is hung", () => {
  test("at the centroid of its largest polygon", () => {
    const part: Keepout = {
      ...STAIR_ROOM,
      polygons: [
        { exterior: [[0, 0], [1, 0], [1, 1], [0, 1]], holes: [] },
        { exterior: [[10, 10], [14, 10], [14, 12], [10, 12]], holes: [] },
      ],
    };
    expect(anchorOf(part)).toEqual([12, 11]);
  });

  test("nowhere without a polygon", () => {
    expect(anchorOf(STAIR_ROOM)).toBeNull();
  });
});
