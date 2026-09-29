import { describe, expect, test } from "bun:test";
import { heightAfterDrag, heightsOf, stopAfterDrag, stopAfterKey, stopAfterRelease, valueOf, wordsOf } from "./sheet-stops";

// The room of the Studio on a phone of 390 by 844: what is between the top bar and the tab bar.
const ROOM = 716;
const PEEK = 84;
const HEIGHTS = heightsOf(ROOM, PEEK);

describe("heightsOf: where the stops are", () => {
  test("peek shows the handle and what is first, half is half the room, full all of it", () => {
    expect(HEIGHTS).toEqual({ peek: 84, half: 358, full: 716 });
  });

  test("half a pixel is none", () => {
    expect(heightsOf(715, 84).half).toBe(358);
  });

  test("in a room that is low the stops never cross: peek is the lowest, full the highest", () => {
    expect(heightsOf(120, 84)).toEqual({ peek: 84, half: 84, full: 120 });
    expect(heightsOf(60, 84)).toEqual({ peek: 60, half: 60, full: 60 });
  });

  test("a room that was not measured yet has no height", () => {
    expect(heightsOf(0, 84)).toEqual({ peek: 0, half: 0, full: 0 });
  });
});

describe("heightAfterDrag", () => {
  test("the sheet follows the pointer: up makes it higher, down lower", () => {
    expect(heightAfterDrag(358, 400, 300, HEIGHTS)).toBe(458);
    expect(heightAfterDrag(358, 400, 450, HEIGHTS)).toBe(308);
  });

  test("never higher than the room, never lower than peek", () => {
    expect(heightAfterDrag(358, 400, -900, HEIGHTS)).toBe(716);
    expect(heightAfterDrag(358, 400, 2000, HEIGHTS)).toBe(84);
  });
});

describe("stopAfterDrag", () => {
  test("let go near a stop, the sheet goes to it", () => {
    expect(stopAfterDrag("half", 700, HEIGHTS)).toBe("full");
    expect(stopAfterDrag("half", 100, HEIGHTS)).toBe("peek");
    expect(stopAfterDrag("peek", 600, HEIGHTS)).toBe("full");
    expect(stopAfterDrag("full", 380, HEIGHTS)).toBe("half");
  });

  test("a quarter of the way to the next stop is enough to go there", () => {
    expect(stopAfterDrag("half", 358 + 90, HEIGHTS)).toBe("full");
    expect(stopAfterDrag("half", 358 - 69, HEIGHTS)).toBe("peek");
    expect(stopAfterDrag("peek", 84 + 69, HEIGHTS)).toBe("half");
    expect(stopAfterDrag("full", 716 - 90, HEIGHTS)).toBe("half");
  });

  test("less than that, and it goes back to where it was", () => {
    expect(stopAfterDrag("half", 358 + 80, HEIGHTS)).toBe("half");
    expect(stopAfterDrag("half", 358 - 60, HEIGHTS)).toBe("half");
    expect(stopAfterDrag("full", 716 - 40, HEIGHTS)).toBe("full");
    expect(stopAfterDrag("peek", 84, HEIGHTS)).toBe("peek");
  });
});

describe("stopAfterKey", () => {
  test.each([
    ["ArrowUp", "peek", "half"],
    ["ArrowUp", "half", "full"],
    ["ArrowDown", "full", "half"],
    ["ArrowDown", "half", "peek"],
    ["Home", "full", "peek"],
    ["End", "peek", "full"],
  ] as const)("%s from %s goes to %s", (key, from, to) => {
    expect(stopAfterKey(from, key)).toBe(to);
  });

  test("the arrows stop at the ends", () => {
    expect(stopAfterKey("full", "ArrowUp")).toBeNull();
    expect(stopAfterKey("peek", "ArrowDown")).toBeNull();
  });

  test("Enter and the space bar open it one stop further, and close it from full", () => {
    expect(stopAfterKey("peek", "Enter")).toBe("half");
    expect(stopAfterKey("half", " ")).toBe("full");
    expect(stopAfterKey("full", "Enter")).toBe("peek");
  });

  test("any other key changes nothing", () => {
    expect(stopAfterKey("half", "a")).toBeNull();
    expect(stopAfterKey("half", "Tab")).toBeNull();
    expect(stopAfterKey("half", "ArrowLeft")).toBeNull();
  });
});

describe("stopAfterRelease", () => {
  test("a press on the handle that did not move it opens the sheet one stop further, as Enter does", () => {
    expect(stopAfterRelease("peek", 84, 84, HEIGHTS)).toBe("half");
    expect(stopAfterRelease("half", 358, 360, HEIGHTS)).toBe("full");
    expect(stopAfterRelease("full", 716, 714, HEIGHTS)).toBe("peek");
  });

  test("a drag ends where a drag ends", () => {
    expect(stopAfterRelease("half", 358, 700, HEIGHTS)).toBe("full");
    expect(stopAfterRelease("half", 358, 300, HEIGHTS)).toBe("half");
    expect(stopAfterRelease("half", 358, 280, HEIGHTS)).toBe("peek");
  });
});

describe("what the handle says", () => {
  test("how far the sheet is open, from 0 to 100", () => {
    expect(valueOf("peek")).toBe(0);
    expect(valueOf("half")).toBe(50);
    expect(valueOf("full")).toBe(100);
  });

  test("the stop in words", () => {
    expect(wordsOf("peek")).toBe("Closed");
    expect(wordsOf("half")).toBe("Half open");
    expect(wordsOf("full")).toBe("Open");
  });
});
