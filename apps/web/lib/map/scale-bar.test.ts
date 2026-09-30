import { describe, expect, test } from "bun:test";
import { metresPerPixel, scaleBarOf } from "./scale-bar";

describe("metres per pixel", () => {
  test("at zoom 19 and the latitude of Pune a pixel is about 0.28 m", () => {
    expect(metresPerPixel(18.52, 19)).toBeCloseTo(0.2831, 3);
  });

  test("at the equator and zoom 0 the world is one tile wide", () => {
    expect(metresPerPixel(0, 0) * 256).toBeCloseTo(40_075_016.686, 0);
  });

  test("with tiles of 512 a pixel is half as much", () => {
    expect(metresPerPixel(18.52, 19, 512)).toBeCloseTo(metresPerPixel(18.52, 19) / 2, 6);
  });
});

describe("the scale bar", () => {
  test("shows the largest round length that fits: 20 m in 124 px at roof zoom", () => {
    expect(scaleBarOf(metresPerPixel(18.52, 19), 124)).toEqual({ metres: 20, widthPx: 71, label: "20 m" });
  });

  test("zoomed out, kilometres", () => {
    expect(scaleBarOf(metresPerPixel(18.52, 12), 124)).toEqual({ metres: 2000, widthPx: 55, label: "2 km" });
  });

  test("from far, hundreds of kilometres", () => {
    expect(scaleBarOf(metresPerPixel(21.5, 4), 124)).toEqual({ metres: 1_000_000, widthPx: 110, label: "1000 km" });
  });

  test("zoomed in beyond a metre a pixel, the shortest that fits", () => {
    expect(scaleBarOf(0.05, 124)?.metres).toBe(5);
  });

  test("when even a metre is wider than the room, there is no bar", () => {
    expect(scaleBarOf(0.001, 124)).toBeNull();
  });
});
