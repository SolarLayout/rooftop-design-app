import { describe, expect, test } from "bun:test";
import { fadeOf, intensitiesOf, shadowBiasOf } from "./sun-light";

// The sun light of the scene, from the reference project (plan/reference/r3f-notes.md, fixes 5 to 7):
// the light fades out below 8°, the shadow's bias grows as the sun grazes, the ambient follows the sun.

describe("the fade of the light near the horizon", () => {
  test("is whole above 8°, none at the horizon, in between below", () => {
    expect(fadeOf(45)).toBe(1);
    expect(fadeOf(8)).toBe(1);
    expect(fadeOf(4)).toBeCloseTo(0.5, 6);
    expect(fadeOf(0)).toBe(0);
    expect(fadeOf(-3)).toBe(0);
  });
});

describe("the shadow bias", () => {
  test("is at least 0.1 and grows as the sun grazes, up to eight times", () => {
    const high = shadowBiasOf(60, 49.24, 2048);
    const low = shadowBiasOf(5, 49.24, 2048);
    expect(high.normalBias).toBeGreaterThanOrEqual(0.1);
    expect(low.normalBias).toBeGreaterThan(high.normalBias);
    expect(shadowBiasOf(1, 49.24, 2048).normalBias).toBeCloseTo(shadowBiasOf(3, 49.24, 2048).normalBias, 6);
    expect(high.bias).toBe(-0.00012);
  });
});

describe("the intensities", () => {
  test("the sun's follows its height and the fade; the ambient never goes out", () => {
    expect(intensitiesOf(90).sun).toBeCloseTo(2.6, 6);
    expect(intensitiesOf(0).sun).toBe(0);
    expect(intensitiesOf(0).ambient).toBeGreaterThan(0);
    expect(intensitiesOf(60).ambient).toBeGreaterThan(intensitiesOf(10).ambient);
  });
});
