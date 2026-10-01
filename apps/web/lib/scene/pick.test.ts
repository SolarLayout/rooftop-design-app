import { describe, expect, test } from "bun:test";
import type { PlacedModule, Roof } from "../api";
import { anchorOfModule, anchorOfRoof, calloutOfModule, calloutOfRoof, isAPress, selectionOfPick } from "./pick";

// Selection by raycast (plan/phase-05-plan.md, step 17, decision 10): what a press on each thing of the
// scene selects, and the callouts of a module and of the roof.

const FLAT = () => 0;

const MODULE: PlacedModule = {
  idx: 122,
  outline: [
    [2.362985, 7.45],
    [2.362985, 9.649413],
    [1.229985, 9.649413],
    [1.229985, 7.45],
  ],
  row: 1,
  col: 0,
  line: 0,
  tilt: 15,
  azimuth: 180,
  z_low: 0.5,
  z_high: 1.089331,
};

const DEMO: Pick<Roof, "outline"> = {
  outline: [
    [90, 0],
    [90, 40],
    [0, 40],
    [0, 0],
  ],
};

describe("what a press selects", () => {
  test("the roof, an obstacle, a kept-clear area and a module, each by its index", () => {
    expect(selectionOfPick({ what: "roof" })).toEqual({ kind: "roof" });
    expect(selectionOfPick({ what: "obstacle", index: 2 })).toEqual({ kind: "obstacle", index: 2 });
    expect(selectionOfPick({ what: "keepout", index: 1 })).toEqual({ kind: "keepout", index: 1 });
    expect(selectionOfPick({ what: "module", instanceId: 122 })).toEqual({ kind: "module", index: 122 });
  });

  test("the ground clears; so does a module whose instance is not known", () => {
    expect(selectionOfPick({ what: "ground" })).toBeNull();
    expect(selectionOfPick({ what: "module", instanceId: undefined })).toBeNull();
  });

  test("a press is a pointer that moved a few pixels at most between down and up: a drag of the camera is none", () => {
    expect(isAPress(0)).toBe(true);
    expect(isAPress(4)).toBe(true);
    expect(isAPress(5)).toBe(false);
  });
});

describe("the callout of a module", () => {
  test("its position, counted from one, and its row with its tilt and where it faces", () => {
    expect(calloutOfModule(MODULE, "flat_tilted")).toEqual({ title: "Position 123", detail: "Row 2 · 15° to the south" });
  });

  test("on an east-west roof a row is a unit, and the side faces east or west", () => {
    expect(calloutOfModule({ ...MODULE, row: 0, tilt: 10, azimuth: 90 }, "flat_ew").detail).toBe("Unit 1 · 10° to the east");
    expect(calloutOfModule({ ...MODULE, row: 0, tilt: 10, azimuth: 270 }, "flat_ew").detail).toBe("Unit 1 · 10° to the west");
  });

  test("a tilt that is not whole keeps one decimal; the direction is the nearest of eight", () => {
    expect(calloutOfModule({ ...MODULE, tilt: 12.5, azimuth: 150 }, "sloped_flush").detail).toBe("Row 2 · 12.5° to the south-east");
    expect(calloutOfModule({ ...MODULE, tilt: 0, azimuth: 359 }, "flat_tilted").detail).toBe("Row 2 · 0° to the north");
  });

  test("is hung at the top of the module, over the middle of its footprint", () => {
    const [x, y, z] = anchorOfModule(MODULE, FLAT);
    expect(x).toBeCloseTo(1.796485, 6);
    expect(y).toBeCloseTo(8.5497065, 6);
    expect(z).toBeCloseTo(1.089331, 6);
    expect(anchorOfModule(MODULE, () => 2)[2]).toBeCloseTo(3.089331, 6);
  });
});

describe("the callout of the roof", () => {
  test("a rectangle: its sides and its area", () => {
    expect(calloutOfRoof(DEMO.outline)).toEqual({ title: "Roof · selected", detail: "90.0 × 40.0 m · 3,600 m²" });
  });

  test("another shape: its corners and its area", () => {
    const hexagon: [number, number][] = [
      [0, 0],
      [20, 0],
      [30, 10],
      [20, 20],
      [0, 20],
      [-10, 10],
    ];
    expect(calloutOfRoof(hexagon).detail).toBe("6 corners · 600 m²");
  });

  test("is hung at the roof's centroid, on its surface", () => {
    expect(anchorOfRoof(DEMO.outline, FLAT)).toEqual([45, 20, 0]);
    expect(anchorOfRoof(DEMO.outline, ([, y]) => y / 10)).toEqual([45, 20, 2]);
  });
});
