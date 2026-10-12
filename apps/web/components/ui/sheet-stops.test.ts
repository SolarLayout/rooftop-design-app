import { describe, expect, test } from "bun:test";
import { heightAfterDrag, heightsOf, heightsOfShares, shareUnder, sharesOnPhone, stopAfterDrag, stopAfterKey, stopAfterRelease, valueOf, wordsOf } from "./sheet-stops";

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

  test("half can be another share of the room", () => {
    expect(heightsOf(ROOM, PEEK, 0.6).half).toBe(430);
  });

  test("a share of the room for half still never crosses peek or full", () => {
    expect(heightsOf(ROOM, PEEK, 0.05).half).toBe(84);
    expect(heightsOf(ROOM, PEEK, 1.4).half).toBe(716);
  });
});

describe("shareUnder: the share of the room under what stands at its top", () => {
  test("the Studio on a phone of 390 by 844: the stage and the vitals take 330 of 716", () => {
    expect(shareUnder(716, 330)).toBeCloseTo(386 / 716, 6);
  });

  test("on a taller phone the share grows, on a shorter one it shrinks", () => {
    expect(shareUnder(804, 330)).toBeCloseTo(474 / 804, 6);
    expect(shareUnder(536, 330)).toBeCloseTo(206 / 536, 6);
  });

  test("nothing is left when what stands above fills the room", () => {
    expect(shareUnder(300, 330)).toBe(0);
  });

  test("a room that was not measured yet has no share", () => {
    expect(shareUnder(0, 330)).toBeNull();
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

describe("sharesOnPhone: the sheet of a step on phone (V2 · 10, D106; audit V2-75)", () => {
  // A phone of 390 by 844: the room between the top bar and the tab bar is 716; the sheet at peek shows its handle, the
  // step's instruction and its primary, 156.
  test("peek: the roof has the screen; half: the stage keeps 40 % of the height; full: a strip of 120 of the roof", () => {
    const shares = sharesOnPhone(844, 716, 156);
    expect(shares.peek * 716).toBeCloseTo(156, 6);
    expect(716 - shares.half * 716).toBeCloseTo(338, 6);
    expect(716 - shares.full * 716).toBeCloseTo(120, 6);
  });

  test("a taller phone keeps 40 % of its own height at half", () => {
    const shares = sharesOnPhone(932, 804, 156);
    expect(804 - shares.half * 804).toBeCloseTo(373, 6);
  });

  test("a short room: the stops never cross, peek the lowest, full the highest", () => {
    const shares = sharesOnPhone(500, 300, 156);
    expect(shares.peek).toBeLessThanOrEqual(shares.half);
    expect(shares.half).toBeLessThanOrEqual(shares.full);
    expect(shares.full).toBeLessThanOrEqual(1);
  });

  test("a room not measured yet: the sheet takes it all at every stop", () => {
    expect(sharesOnPhone(844, 0, 156)).toEqual({ peek: 1, half: 1, full: 1 });
  });

  test("the heights of the shares in a room, for a drag", () => {
    expect(heightsOfShares(716, { peek: 0.25, half: 0.5, full: 1 })).toEqual({ peek: 179, half: 358, full: 716 });
  });
});
