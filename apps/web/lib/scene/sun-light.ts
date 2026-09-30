// The numbers of the sun light, from the reference project (plan/reference/r3f-notes.md, fixes 5 to 7).
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

/**
 * The bias of the shadow map, scaled with the sun: as it grazes the roof the depth changes fast across
 * one texel of the map, so the sample point is moved along the normal by more texels, up to eight.
 */
export function shadowBiasOf(elevationDeg: number, radius: number, mapSize: number): { bias: number; normalBias: number } {
  const texel = (radius * 2.2) / mapSize;
  const grazing = Math.min(8, 1 / Math.max(0.12, Math.sin(toRadians(elevationDeg))));
  return { bias: -0.00012, normalBias: Math.max(0.1, texel * 3 * grazing) };
}

/**
 * The strength of the sun light and of the ambient light, with the sun's height. The ambient stays
 * strong, so that a shadow reads as the boards draw it (a third darker), never as black.
 */
export function intensitiesOf(elevationDeg: number): { sun: number; ambient: number } {
  const height = Math.max(0, Math.sin(toRadians(elevationDeg)));
  return { sun: fadeOf(elevationDeg) * (height * 1.6 + 0.2), ambient: 0.9 + height * 0.6 };
}
