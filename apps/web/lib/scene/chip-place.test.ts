import { describe, expect, test } from "bun:test";
import { centredBoxOf, chipBoxOf, clearOf, overlaps, type Box } from "./chip-place";

// The chips of the inverters over the stage (plan/phase-07-plan.md, decision 13) stand clear of the labels of the
// roof's edges (plan/phase-11-plan.md, step 33): where the projection puts a chip over a label, the chip moves by the
// smallest shift that clears it. Pixels of the canvas, from its top left; the boxes are what the DOM measured.

const box = (left: number, top: number, right: number, bottom: number): Box => ({ left, top, right, bottom });

describe("the boxes", () => {
  test("a chip stands centred on its point, its foot over it", () => {
    expect(chipBoxOf([100, 200], { width: 40, height: 20 }, 4)).toEqual(box(80, 176, 120, 196));
  });

  test("a label stands centred on its point", () => {
    expect(centredBoxOf([100, 200], { width: 50, height: 22 })).toEqual(box(75, 189, 125, 211));
  });

  test("two boxes overlap when they share an area; touching is not overlapping", () => {
    expect(overlaps(box(0, 0, 10, 10), box(5, 5, 15, 15))).toBe(true);
    expect(overlaps(box(0, 0, 10, 10), box(10, 0, 20, 10))).toBe(false);
    expect(overlaps(box(0, 0, 10, 10), box(0, 10, 10, 20))).toBe(false);
    expect(overlaps(box(0, 0, 10, 10), box(20, 20, 30, 30))).toBe(false);
  });
});

describe("a chip kept off the labels", () => {
  test("clear of every label, it stays where the projection put it", () => {
    expect(clearOf(box(80, 176, 120, 196), [box(200, 180, 250, 202)])).toEqual([0, 0]);
    expect(clearOf(box(80, 176, 120, 196), [])).toEqual([0, 0]);
  });

  test("over a label by a little at its foot, it moves up by just that: the smallest shift", () => {
    // The chip's bottom at 196, the label's top at 192: four pixels over it.
    expect(clearOf(box(80, 176, 120, 196), [box(60, 192, 140, 214)])).toEqual([0, -4]);
  });

  test("over the side of a label, it moves sideways where that is the smaller shift", () => {
    // The chip reaches 6 into the label from its left; up would be 15, down 25.
    expect(clearOf(box(80, 176, 120, 196), [box(114, 161, 180, 221)])).toEqual([-6, 0]);
    // The same from the right: the label ends 6 into the chip.
    expect(clearOf(box(80, 176, 120, 196), [box(20, 161, 86, 221)])).toEqual([6, 0]);
  });

  test("of two equal shifts, up wins: the chip stands over its box, and the roof is under it", () => {
    // Up by 4 and left by 4 both clear it.
    expect(clearOf(box(80, 176, 120, 196), [box(116, 192, 200, 220)])).toEqual([0, -4]);
  });

  test("a shift that clears one label but lands on another is followed by the next, until the chip is clear", () => {
    const chip = box(80, 176, 120, 196);
    // Up by 4 clears the first; the chip then overlaps the second, which it clears by 3 more.
    const first = box(60, 192, 140, 214);
    const second = box(60, 160, 140, 175);
    const [dx, dy] = clearOf(chip, [first, second]);
    const moved = box(chip.left + dx, chip.top + dy, chip.right + dx, chip.bottom + dy);
    expect(overlaps(moved, first)).toBe(false);
    expect(overlaps(moved, second)).toBe(false);
    expect(Math.abs(dx) + Math.abs(dy)).toBeLessThanOrEqual(40);
  });

  test("the demo on phone: INV-1 over the label of the south edge moves up off it", () => {
    // The plan on phone, 2.2 pixels a metre: the box's top at (195, 150), the edge's middle at (234, 152).
    const chip = chipBoxOf([195, 150], { width: 42, height: 20 }, 4);
    const label = centredBoxOf([234, 152], { width: 52, height: 22 });
    expect(overlaps(chip, label)).toBe(true);

    const [dx, dy] = clearOf(chip, [label]);

    expect([dx, dy]).toEqual([0, -5]);
    expect(overlaps(box(chip.left + dx, chip.top + dy, chip.right + dx, chip.bottom + dy), label)).toBe(false);
  });
});
