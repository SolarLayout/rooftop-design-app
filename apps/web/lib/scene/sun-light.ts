// The numbers of the sun light, from the reference project (plan/reference/r3f-notes.md, fixes 5 to 7), the
// bias held to the engine's shadows (plan/phase-06-plan.md, decision 9), the strengths held to the palette.
import { Color } from "three";
import { PALETTE } from "../geometry/scene-palette";
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

/** The height of the sun the light is held to: 10:30 on the design day at Pune, the morning the boards draw. */
const HELD_AT_DEG = 42.6;

/**
 * In shade a surface is 55 % darker than in the sun: a third (the boards' first shade) read too faintly on the roof
 * (the owner, session 18; D73). The sun and the sky still come to π, so a surface in the sun keeps its colour.
 */
const SHADE_SHARE = 0.45;

/** How bright the sky's colour is, as light: its luminance in linear light. */
const SKY = (() => {
  const { r, g, b } = new Color(PALETTE.lightSky).convertSRGBToLinear();
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
})();

/**
 * The strength of the sun light and of the sky's, held to the palette (the boards draw every surface at its
 * colour). Three's Lambert gives back the albedo over π of the light that falls on a surface: a level roof in
 * the sun at HELD_AT_DEG and under the sky gives back its palette colour when the two come to π; in shade the
 * sky alone gives SHADE_SHARE of that. The sun's strength does not change with its height but fades at the
 * horizon; a lower sun lights a level roof less by the angle alone.
 */
export function intensitiesOf(elevationDeg: number): { sun: number; ambient: number } {
  const sun = (Math.PI * (1 - SHADE_SHARE)) / Math.sin(toRadians(HELD_AT_DEG));
  return { sun: fadeOf(elevationDeg) * sun, ambient: (Math.PI * SHADE_SHARE) / SKY };
}

/** Of its palette colour, how much a level roof gives back in the sun at a height, before tone mapping. */
export function levelRoofShareOf(elevationDeg: number): number {
  const { sun, ambient } = intensitiesOf(elevationDeg);
  return (sun * Math.max(0, Math.sin(toRadians(elevationDeg))) + ambient * SKY) / Math.PI;
}

/** The same in shade: the sky alone. */
export function shadeShareOf(): number {
  return (intensitiesOf(0).ambient * SKY) / Math.PI;
}
