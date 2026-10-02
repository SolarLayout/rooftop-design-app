import { describe, expect, test } from "bun:test";
import { fadeOf, intensitiesOf, levelRoofShareOf, shadeShareOf, shadowBiasOf } from "./sun-light";

// The sun light of the scene, from the reference project (plan/reference/r3f-notes.md, fixes 5 to 7):
// the light fades out below 8°, the shadow's bias is held to what it shifts, the ambient follows the sun.

describe("the fade of the light near the horizon", () => {
  test("is whole above 8°, none at the horizon, in between below", () => {
    expect(fadeOf(45)).toBe(1);
    expect(fadeOf(8)).toBe(1);
    expect(fadeOf(4)).toBeCloseTo(0.5, 6);
    expect(fadeOf(0)).toBe(0);
    expect(fadeOf(-3)).toBe(0);
  });
});

// The bias moves the point that looks the shadow map up along its normal: on a level roof the shadow then
// falls as on a plane that much higher, shorter by the bias times the cotangent of the sun's height. The
// rendered shadows must agree with the engine's within 0.2 m (plan/phase-06-plan.md, decision 9).
describe("the shadow bias", () => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const shiftOf = (elevationDeg: number) => shadowBiasOf(elevationDeg, 49.24, 2048).normalBias / Math.tan(toRadians(elevationDeg));

  test.each([1, 4, 8, 12, 17.97, 30, 48, 60, 89.9])("shifts a shadow on a level roof by no more than 0.05 m at %d°", (elevationDeg) => {
    expect(shiftOf(elevationDeg)).toBeLessThanOrEqual(0.05 + 1e-12);
  });

  test("is never more than a texel of the shadow map, and never less than nothing", () => {
    const texel = (49.24 * 2.2) / 2048;
    for (const elevationDeg of [1, 18, 45, 90]) {
      const { normalBias } = shadowBiasOf(elevationDeg, 49.24, 2048);
      expect(normalBias).toBeGreaterThanOrEqual(0);
      expect(normalBias).toBeLessThanOrEqual(texel + 1e-12);
    }
  });

  test("the depth bias is a fraction of a texel's depth", () => {
    expect(shadowBiasOf(18, 49.24, 2048).bias).toBe(-0.00012);
  });
});

// The light is held to the palette (the boards draw every surface at its colour): three's Lambert gives back
// the albedo over π of what falls on a surface, so a level roof under the sun of 10:30 on the design day at Pune
// (42.6° high) and the sky renders at its palette colour when the two come to π; in shade, the sky alone, a third
// darker, as the boards draw shadows.
describe("the intensities", () => {
  test("a level roof in the sun of the design day's morning gives back its palette colour", () => {
    expect(levelRoofShareOf(42.6)).toBeCloseTo(1, 2);
  });

  test("in shade it is a third darker", () => {
    expect(shadeShareOf() / levelRoofShareOf(42.6)).toBeCloseTo(2 / 3, 2);
  });

  test("the sun's light does not change with its height, until it fades at the horizon; the sky's never goes out", () => {
    expect(intensitiesOf(60).sun).toBeCloseTo(intensitiesOf(20).sun, 9);
    expect(intensitiesOf(4).sun).toBeCloseTo(intensitiesOf(20).sun / 2, 9);
    expect(intensitiesOf(0).sun).toBe(0);
    expect(intensitiesOf(0).ambient).toBe(intensitiesOf(60).ambient);
  });

  test("so the roof is a little lighter at noon and darker late in the day", () => {
    expect(levelRoofShareOf(48)).toBeGreaterThan(1);
    expect(levelRoofShareOf(18)).toBeLessThan(0.9);
    expect(levelRoofShareOf(18)).toBeGreaterThan(shadeShareOf());
  });
});
