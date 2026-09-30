// The colours of the 3D scene, for three.js, which cannot read a stylesheet. docs/design/design-tokens.md,
// "3D scene palette", has the same; scene-palette.test.ts holds the two equal. Every other colour of the
// app is a CSS token (rule 9 of CLAUDE.md); what stands over the stage in the DOM reads those.

/** A colour as three.js takes it: a hex, with an alpha where something is see-through. */
export const PALETTE = {
  stage: "#0B0E13",
  groundPlain: "#12161D",
  gridLine: "#1B222D",
  roof: "#D3D6DB",
  roofEdge: "#ECEEF0",
  parapetCap: "#ECEEF0",
  parapetLit: "#B9BEC6",
  parapetShade: "#8E95A0",
  wallLit: "#4A5262",
  wallShade: "#2E3440",
  obstacleTop: "#F1F2F4",
  obstacleLit: "#C2C7CF",
  obstacleShade: "#868D99",
  treeTrunk: "#6B5A48",
  treeCrown: "#4F7A4A",
  moduleGlass: "#16294D",
  moduleCellLine: "#2A4675",
  moduleFrame: "#33558C",
  moduleUnused: "#8C93A0",
  walkway: "#C4C8CE",
  keepOutFill: "#FFB02030",
  keepOutLine: "#FFB020",
  selection: "#FFB020",
  hover: "#FFD36B",
  sun: "#FFB020",
  sunCore: "#FFD36B",
  lightSun: "#FFF4E0",
  lightSky: "#BCD0E8",
  lightGround: "#20242C",
} as const;

export type PaletteName = keyof typeof PALETTE;

/** The hex of a colour without its alpha, and its alpha as a share from 0 to 1 (1 where it has none). */
export function colourOf(name: PaletteName): { hex: string; opacity: number } {
  const value = PALETTE[name];
  if (value.length === 9) return { hex: value.slice(0, 7), opacity: parseInt(value.slice(7), 16) / 255 };
  return { hex: value, opacity: 1 };
}
