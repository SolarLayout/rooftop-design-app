import { describe, expect, test } from "bun:test";
import { fadeOf, intensitiesOf, shadowBiasOf } from "./sun-light";

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

describe("the intensities", () => {
  test("the sun's follows its height and the fade; the ambient never goes out", () => {
    expect(intensitiesOf(90).sun).toBeCloseTo(1.8, 6);
    expect(intensitiesOf(0).sun).toBe(0);
    expect(intensitiesOf(0).ambient).toBeGreaterThan(0);
    expect(intensitiesOf(60).ambient).toBeGreaterThan(intensitiesOf(10).ambient);
  });
});
