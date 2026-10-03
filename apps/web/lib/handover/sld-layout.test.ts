import { describe, expect, test } from "bun:test";
import type { DesignOption } from "../api";
import { sldOf } from "./sld";
import { DOWNWARD_UNDER, sldLayoutOf, type SldLayout, type SldText } from "./sld-layout";
import { A, EQUIPMENT, MPPT_LOADS, STRINGS } from "./test-fixtures";

// The engine's geometry (plots.py, draw_sld): x from −0.5 to 18, a box per inverter 2.6 wide and max(n_mppt, 2) × 1.1 + 1.0
// high at x 6.2, stacked 1.2 apart; the MPPT blocks 2.2 by 0.6 at x 0.2, one every 1.1 from y 1.2; the AC line, the ACDB,
// the meter and the grid to the right. Laid out in pixels for the frame's width: across at 925 wide one unit is 50 px.

const ONE = sldOf(A, EQUIPMENT);
const TWO = sldOf(
  {
    ...A,
    n_inverters: 2,
    system: { ...A.system, n_inverters: 2, strings: STRINGS.map((string, index) => ({ ...string, inverter: index < 12 ? 1 : 2, mppt: index < 12 ? Math.floor(index / 4) + 1 : Math.floor((index - 12) / 4) + 1 })) },
    mppt_loads: [...MPPT_LOADS.slice(0, 3), ...MPPT_LOADS.slice(0, 3).map((load) => ({ ...load, inverter: 2 }))],
  } as unknown as DesignOption,
  EQUIPMENT,
);

const text = (layout: SldLayout, words: string): SldText[] => layout.texts.filter((one) => one.words === words);
const box = (layout: SldLayout, x: number, y: number) => layout.boxes.find((one) => one.x === x && one.y === y);

describe("across: the engine's drawing scaled to the width (the board on desktop)", () => {
  const layout = sldLayoutOf(ONE, 925);

  test("the shape, the size: 18.5 units across, from 0.2 over the first box to 0.6 under the last", () => {
    expect(layout.shape).toBe("across");
    expect(layout.width).toBe(925);
    expect(layout.height).toBe(420);
  });

  test("the inverter's box at x 6.2, 2.6 wide and 7.6 high for six MPPTs, its label and its words in it", () => {
    expect(box(layout, 335, 10)).toEqual({ x: 335, y: 10, w: 130, h: 380 });
    expect(text(layout, "INV-1")).toEqual([{ x: 400, y: 35, words: "INV-1", anchor: "middle", baseline: "middle", look: "name" }]);
    expect(text(layout, "275 kW · 6 MPPT")).toEqual([{ x: 400, y: 57.5, words: "275 kW · 6 MPPT", anchor: "middle", baseline: "middle", look: "caption" }]);
  });

  test("a block per MPPT at x 0.2, 2.2 by 0.6 around its line's height, its words in its middle, its MPPT with it", () => {
    expect(layout.blocks).toHaveLength(6);
    const first = layout.blocks[0]!;
    expect(first).toMatchObject({ inverter: 0, x: 35, y: 55, w: 110, h: 30, text: { x: 90, y: 70 } });
    expect(first.mppt).toBe(ONE.inverters[0]!.mppts[0]!);
    expect(layout.blocks[5]!).toMatchObject({ y: 55 + 5 * 55, mppt: ONE.inverters[0]!.mppts[5]! });
  });

  test("the DC line from the block to the box with its words 7 over it; the AC line from the box to the ACDB", () => {
    expect(layout.lines).toContainEqual({ x1: 145, y1: 70, x2: 335, y2: 70, weight: "dc" });
    expect(text(layout, "MPPT 1 · DC")).toEqual([{ x: 240, y: 63, words: "MPPT 1 · DC", anchor: "middle", baseline: "auto", look: "caption" }]);
    expect(layout.lines).toContainEqual({ x1: 465, y1: 200, x2: 555, y2: 200, weight: "ac" });
    expect(text(layout, "AC")).toEqual([{ x: 510, y: 193, words: "AC", anchor: "middle", baseline: "auto", look: "caption" }]);
  });

  test("the ACDB 0.6 over and under the AC line, the meter 0.9 high, the grid in two lines at x 16.1", () => {
    expect(box(layout, 555, 170)).toEqual({ x: 555, y: 170, w: 70, h: 60 });
    expect(text(layout, "ACDB")).toEqual([{ x: 590, y: 163, words: "ACDB", anchor: "middle", baseline: "auto", look: "name" }]);
    expect(layout.lines).toContainEqual({ x1: 625, y1: 200, x2: 695, y2: 200, weight: "ac" });
    expect(box(layout, 695, 177.5)).toEqual({ x: 695, y: 177.5, w: 55, h: 45 });
    expect(text(layout, "kWh")).toEqual([{ x: 722.5, y: 200, words: "kWh", anchor: "middle", baseline: "middle", look: "value" }]);
    expect(text(layout, "Net meter")).toEqual([{ x: 722.5, y: 237.5, words: "Net meter", anchor: "middle", baseline: "hanging", look: "caption" }]);
    expect(layout.lines).toContainEqual({ x1: 750, y1: 200, x2: 825, y2: 200, weight: "ac" });
    expect(text(layout, "Grid /")).toEqual([{ x: 830, y: 191, words: "Grid /", anchor: "start", baseline: "middle", look: "words" }]);
    expect(text(layout, "LT panel")).toEqual([{ x: 830, y: 209, words: "LT panel", anchor: "start", baseline: "middle", look: "words" }]);
  });

  test("two inverters stack 1.2 apart, the ACDB spans both AC lines, the height follows", () => {
    const two = sldLayoutOf(TWO, 925);
    expect(two.height).toBe(860);
    expect(box(two, 335, 450)).toEqual({ x: 335, y: 450, w: 130, h: 380 });
    expect(text(two, "INV-2")[0]).toMatchObject({ x: 400, y: 475 });
    expect(two.blocks.filter((block) => block.inverter === 1)).toHaveLength(3);
    expect(two.blocks.filter((block) => block.inverter === 1)[0]).toMatchObject({ x: 35, y: 495 });
    expect(two.lines.filter((line) => line.weight === "ac" && line.x1 === 465).map((line) => line.y1)).toEqual([200, 640]);
    expect(box(two, 555, 170)).toEqual({ x: 555, y: 170, w: 70, h: 500 });
    expect(text(two, "kWh")[0]).toMatchObject({ y: 420 });
  });

  test("an MPPT without strings has no block and no line: its words stand where the line would be", () => {
    const two = sldLayoutOf(TWO, 925);
    expect(two.lines.filter((line) => line.weight === "dc")).toHaveLength(6);
    expect(text(two, "MPPT 4 · not used")).toEqual([
      { x: 240, y: 235, words: "MPPT 4 · not used", anchor: "middle", baseline: "middle", look: "caption" },
      { x: 240, y: 675, words: "MPPT 4 · not used", anchor: "middle", baseline: "middle", look: "caption" },
    ]);
  });
});

describe("down: under the phone's width the AC side runs down from the inverter, so that every word keeps its size (the board on phone)", () => {
  const layout = sldLayoutOf(ONE, 372);

  test("the shape is chosen by the width", () => {
    expect(DOWNWARD_UNDER).toBe(700);
    expect(sldLayoutOf(ONE, 699).shape).toBe("down");
    expect(sldLayoutOf(ONE, 700).shape).toBe("across");
  });

  test("9.3 units across: the DC side scaled to the width, the inverter's words on two lines", () => {
    expect(layout.width).toBe(372);
    expect(box(layout, 268, 8)).toEqual({ x: 268, y: 8, w: 104, h: 304 });
    expect(text(layout, "INV-1")[0]).toMatchObject({ x: 320, y: 28, look: "name" });
    expect(text(layout, "275 kW")[0]).toMatchObject({ x: 320, y: 46, look: "caption-s" });
    expect(text(layout, "6 MPPT")[0]).toMatchObject({ x: 320, y: 60, look: "caption-s" });
    expect(layout.blocks[0]).toMatchObject({ x: 28, y: 44, w: 88, h: 24, text: { x: 72, y: 56 } });
    expect(text(layout, "MPPT 1 · DC")).toEqual([{ x: 192, y: 50, words: "MPPT 1 · DC", anchor: "middle", baseline: "auto", look: "caption-s" }]);
  });

  test("the AC chain down the middle of the inverter: 40 to the ACDB of 92 by 36, 36 to the meter of 60 by 36, 36 to the grid", () => {
    expect(layout.lines).toContainEqual({ x1: 320, y1: 312, x2: 320, y2: 352, weight: "ac" });
    expect(text(layout, "AC")).toEqual([{ x: 328, y: 332, words: "AC", anchor: "start", baseline: "middle", look: "caption-s" }]);
    expect(box(layout, 274, 352)).toEqual({ x: 274, y: 352, w: 92, h: 36 });
    expect(text(layout, "ACDB")[0]).toMatchObject({ x: 320, y: 370, look: "name" });
    expect(layout.lines).toContainEqual({ x1: 320, y1: 388, x2: 320, y2: 424, weight: "ac" });
    expect(box(layout, 290, 424)).toEqual({ x: 290, y: 424, w: 60, h: 36 });
    expect(text(layout, "kWh")[0]).toMatchObject({ x: 320, y: 442, look: "value" });
    expect(text(layout, "Net meter")).toEqual([{ x: 282, y: 442, words: "Net meter", anchor: "end", baseline: "middle", look: "caption-s" }]);
    expect(layout.lines).toContainEqual({ x1: 320, y1: 460, x2: 320, y2: 496, weight: "ac" });
    expect(text(layout, "Grid / LT panel")).toEqual([{ x: 320, y: 506, words: "Grid / LT panel", anchor: "middle", baseline: "hanging", look: "words" }]);
    expect(layout.height).toBe(526);
  });

  test("two inverters: 10 units across, each box's AC line to a bus at the right, which runs down past the last box and back to the chain", () => {
    const two = sldLayoutOf(TWO, 400);
    expect(two.shape).toBe("down");
    expect(box(two, 268, 8)).toEqual({ x: 268, y: 8, w: 104, h: 304 });
    expect(box(two, 268, 360)).toEqual({ x: 268, y: 360, w: 104, h: 304 });
    // Each inverter's AC line from its right edge to the bus; "AC" over each.
    expect(two.lines).toContainEqual({ x1: 372, y1: 160, x2: 388, y2: 160, weight: "ac" });
    expect(two.lines).toContainEqual({ x1: 372, y1: 512, x2: 388, y2: 512, weight: "ac" });
    expect(text(two, "AC")).toHaveLength(2);
    // The bus from the first line down to 40 under the last box, then back to the middle of the boxes, where the chain begins.
    expect(two.lines).toContainEqual({ x1: 388, y1: 160, x2: 388, y2: 704, weight: "ac" });
    expect(two.lines).toContainEqual({ x1: 388, y1: 704, x2: 320, y2: 704, weight: "ac" });
    expect(box(two, 274, 704)).toEqual({ x: 274, y: 704, w: 92, h: 36 });
  });
});
