// The numbers of the sun light, from the reference project (plan/reference/r3f-notes.md, fixes 5 to 7), the
// bias held to the engine's shadows (plan/phase-06-plan.md, decision 9).
// Pure functions of the sun's height in degrees; the component sets what they give on the light.

/** Below this height the light fades, and at the horizon it is out: shadow maps degrade badly there. */
const FADE_BELOW_DEG = 8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** How much of the sun light is left, from 1 high up to 0 at the horizon. */
export function fadeOf(elevationDeg: number): number {
  if (elevationDeg <= 0) return 0;
  if (elevationDeg >= FADE_BELOW_DEG) return 1;
  return elevationDeg / FADE_BELOW_DEG;
}

/** The most a shadow on a level roof may move by the bias, in metres: well inside the 0.2 m of the acceptance. */
const SHIFT_AT_MOST = 0.05;

/**
 * The bias of the shadow map, held to what it moves (plan/phase-06-plan.md, decision 9). The normal bias
 * lifts the point that looks the map up along its normal: a shadow on a level roof falls as on a plane
 * that much higher, shorter by the bias times the cotangent of the sun's height. So it is at most a
 * texel, and less as the sun grazes, so that the shift stays under 5 cm. The acne it would have hidden is
 * kept away by the casters, which draw their back faces into the map (`shadowSide`), and the depth bias.
 */
export function shadowBiasOf(elevationDeg: number, radius: number, mapSize: number): { bias: number; normalBias: number } {
  const texel = (radius * 2.2) / mapSize;
  const height = toRadians(Math.max(0, Math.min(90, elevationDeg)));
  return { bias: -0.00012, normalBias: Math.min(texel, SHIFT_AT_MOST * Math.tan(height)) };
}

/**
 * The strength of the sun light and of the ambient light, with the sun's height. The ambient stays
 * strong, so that a shadow reads as the boards draw it (a third darker), never as black.
 */
export function intensitiesOf(elevationDeg: number): { sun: number; ambient: number } {
  const height = Math.max(0, Math.sin(toRadians(elevationDeg)));
  return { sun: fadeOf(elevationDeg) * (height * 1.6 + 0.2), ambient: 0.9 + height * 0.6 };
}
