// The colour of each position's glass (plan/phase-06-plan.md, decisions 11 and 12; plan/phase-07-plan.md, step
// 13): the modules' blue, or a colour per position from what the stage colours the glass by, the shade map's
// steps in the Sun lens or the strings in the Strings lens. Written per instance, never as geometry.
import { PALETTE } from "../geometry/scene-palette";

const STEPS = [PALETTE.shade1, PALETTE.shade2, PALETTE.shade3, PALETTE.shade4, PALETTE.shade5];

/** The colour of every position's step of the shade map. */
export function shadeColoursOf(steps: readonly number[]): string[] {
  return steps.map((step) => STEPS[step] ?? PALETTE.shade1);
}

/** One colour per position: its own when there is one for every position, else the modules' blue. */
export function glassColoursOf(positions: number, colours: readonly string[] | null): string[] {
  if (colours && colours.length === positions) return [...colours];
  return Array.from({ length: positions }, () => PALETTE.moduleGlass);
}
