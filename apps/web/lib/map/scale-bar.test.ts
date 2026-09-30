import { describe, expect, test } from "bun:test";
import { metresPerPixel, scaleBarOf } from "./scale-bar";

describe("metres per pixel", () => {
  test("at MapLibre's zoom 18 and the latitude of Pune a pixel is about 0.28 m: the native zoom 19 of tiles of 256", () => {
    expect(metresPerPixel(18.52, 18)).toBeCloseTo(0.2831, 3);
  });

  test("at the equator and zoom 0 the world is 512 pixels wide, as MapLibre counts", () => {
    expect(metresPerPixel(0, 0) * 512).toBeCloseTo(40_075_016.686, 0);
  });

  test("one zoom in halves the metres of a pixel", () => {
    expect(metresPerPixel(18.52, 19)).toBeCloseTo(metresPerPixel(18.52, 18) / 2, 6);
  });
});

describe("the scale bar", () => {
  test("shows the largest round length that fits: 20 m in 124 px at the roof zoom", () => {
    expect(scaleBarOf(metresPerPixel(18.52, 18), 124)).toEqual({ metres: 20, widthPx: 71, label: "20 m" });
  });

  test("zoomed out, kilometres", () => {
    expect(scaleBarOf(metresPerPixel(18.52, 11), 124)).toEqual({ metres: 2000, widthPx: 55, label: "2 km" });
  });

  test("from far, hundreds of kilometres", () => {
    expect(scaleBarOf(metresPerPixel(21.5, 4), 124)).toEqual({ metres: 500_000, widthPx: 110, label: "500 km" });
  });

  test("zoomed in beyond a metre a pixel, the shortest that fits", () => {
    expect(scaleBarOf(0.05, 124)?.metres).toBe(5);
  });

  test("when even a metre is wider than the room, there is no bar", () => {
    expect(scaleBarOf(0.001, 124)).toBeNull();
  });
});
