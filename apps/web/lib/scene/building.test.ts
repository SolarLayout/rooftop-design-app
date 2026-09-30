import { describe, expect, test } from "bun:test";
import { frameOf, parapetWallsOf, wallOf, type RoofOfTheScene } from "./building";

// The demo's roof: 90 by 40, flat, parapet 0.9 m (plan/reference/demo-numbers.md). Its outline is not
// about its centroid: the scene puts the centroid at its origin.
const DEMO: RoofOfTheScene = {
  outline: [
    [0, 0],
    [90, 0],
    [90, 40],
    [0, 40],
  ],
  parapet_h: 0.9,
  slope_deg: 0,
  slope_azimuth_deg: 180,
  roof_type: "flat_tilted",
};

const SLOPED: RoofOfTheScene = { ...DEMO, roof_type: "sloped_flush", slope_deg: 10, parapet_h: 0 };

describe("the frame of the scene", () => {
  test("its origin is the roof's centroid and its radius reaches the farthest corner", () => {
    const frame = frameOf(DEMO);
    expect(frame.centroid).toEqual([45, 20]);
    expect(frame.radius).toBeCloseTo(Math.hypot(45, 20), 6);
  });

  test("a flat roof is at height 0 everywhere", () => {
    expect(frameOf(DEMO).heightAt([80, 35])).toBe(0);
  });

  test("a sloped roof falls toward the direction it faces, about the centroid", () => {
    const { heightAt } = frameOf(SLOPED);
    expect(heightAt([45, 20])).toBeCloseTo(0);
    expect(heightAt([45, 40])).toBeCloseTo(20 * Math.tan((10 * Math.PI) / 180));
    expect(heightAt([45, 0])).toBeCloseTo(-20 * Math.tan((10 * Math.PI) / 180));
    expect(heightAt([90, 20])).toBeCloseTo(0);
  });

  test("a sloped roof facing east falls toward the east", () => {
    const { heightAt } = frameOf({ ...SLOPED, slope_azimuth_deg: 90 });
    expect(heightAt([90, 20])).toBeLessThan(0);
    expect(heightAt([45, 40])).toBeCloseTo(0);
  });

  test("a hexagon has a centroid of its area, not of its corners", () => {
    const hexagon: RoofOfTheScene = {
      ...DEMO,
      outline: [
        [0, 0],
        [10, 0],
        [10, 10],
        [5, 10],
        [5, 5],
        [0, 5],
      ],
    };
    const [x, y] = frameOf(hexagon).centroid;
    expect(x).toBeCloseTo(5.8333, 3);
    expect(y).toBeCloseTo(4.1667, 3);
  });
});

describe("the parapet", () => {
  test("is one wall along each edge, inside it by half its thickness, as high as the parapet", () => {
    const walls = parapetWallsOf(DEMO);
    expect(walls).toHaveLength(4);
    expect(walls[0]).toEqual({ x: 45, y: 0.1, length: 90, width: 0.2, height: 0.9, rotationDeg: 0, zBottom: 0 });
    expect(walls[1]).toEqual({ x: 89.9, y: 20, length: 40, width: 0.2, height: 0.9, rotationDeg: 90, zBottom: 0 });
  });

  test("stands inside the roof whichever way round the outline goes", () => {
    const clockwise: RoofOfTheScene = { ...DEMO, outline: [...DEMO.outline].reverse() };
    expect(parapetWallsOf(clockwise).map((wall) => [wall.x, wall.y])).toEqual(
      expect.arrayContaining([
        [45, 0.1],
        [89.9, 20],
      ]),
    );
  });

  test("there is none without a height", () => {
    expect(parapetWallsOf(SLOPED)).toEqual([]);
  });

  test("on a sloped roof each wall stands at the roof's height under its middle", () => {
    const walls = parapetWallsOf({ ...SLOPED, parapet_h: 0.5 });
    expect(walls[2].zBottom).toBeCloseTo(19.9 * Math.tan((10 * Math.PI) / 180));
  });
});

describe("the walls of the building", () => {
  test("each edge is a quad from the ground to the roof's edge", () => {
    const wall = wallOf(DEMO, 0, 6);
    expect(wall).toEqual([
      [0, 0, -6],
      [90, 0, -6],
      [90, 0, 0],
      [0, 0, 0],
    ]);
  });

  test("under a sloped roof the top follows the pitch", () => {
    const [, , [, , highEast], [, , highWest]] = wallOf(SLOPED, 2, 6);
    expect(highEast).toBeCloseTo(20 * Math.tan((10 * Math.PI) / 180));
    expect(highWest).toBeCloseTo(highEast);
  });
});
