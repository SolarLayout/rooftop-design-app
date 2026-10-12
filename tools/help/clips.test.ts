import { describe, expect, test } from "bun:test";
import { eased, FPS, framesOf, glidePath, lengthOf } from "./clips";
import { HOW_TOS } from "./pictures";

// The clips of the how-tos (Phase 15, D82 to D84): the hand's moves at a pace that can be followed, a frame at a time.

describe("the pace", () => {
  test("a span of seconds is so many frames at thirty a second, one at least", () => {
    expect(FPS).toBe(30);
    expect(framesOf(0.7)).toBe(21);
    expect(framesOf(0)).toBe(1);
  });

  test("a move eases in and out: slow at both ends, the middle half way", () => {
    expect(eased(0)).toBe(0);
    expect(eased(0.5)).toBe(0.5);
    expect(eased(1)).toBe(1);
    expect(eased(0.1)).toBeLessThan(0.1);
    expect(eased(0.9)).toBeGreaterThan(0.9);
  });

  test("the pointer's glide: a place a frame, ending where it goes", () => {
    const path = glidePath({ x: 0, y: 0 }, { x: 100, y: 50 }, 4);
    expect(path).toHaveLength(4);
    expect(path[3]).toEqual({ x: 100, y: 50 });
    expect(path[1]!.x).toBeCloseTo(50);
  });

  test("a clip's length as the step shows it: whole seconds, rounded up", () => {
    expect(lengthOf(120)).toBe("0:04");
    expect(lengthOf(121)).toBe("0:05");
    expect(lengthOf(1830)).toBe("1:01");
  });
});

describe("the clips", () => {
  test("each is named for the step whose picture it plays in, once in its how-to", () => {
    for (const { shots, clips = [] } of HOW_TOS) {
      const names = clips.map(({ name }) => name);
      expect(new Set(names).size).toBe(names.length);
      for (const name of names) expect(shots.map((shot) => shot.name)).toContain(name);
    }
  });

  test("D84's: moving and turning the roof, a rectangle, corners, an obstacle", () => {
    const clipsOf = (dir: string) => HOW_TOS.find((howTo) => howTo.dir === dir)?.clips?.map(({ name }) => name);
    expect(clipsOf("find/move-the-roof")).toEqual(["2", "3"]);
    expect(clipsOf("find/rectangle")).toEqual(["1", "2"]);
    expect(clipsOf("find/corners")).toEqual(["2"]);
    expect(clipsOf("find/move-an-obstacle")).toEqual(["2", "3"]);
  });
});
