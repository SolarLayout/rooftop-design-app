// The colour of each position's glass (plan/phase-06-plan.md, decisions 11 and 12): the modules' blue, or
// the colour of its step of the shade map while the map is shown. Written per instance, never as geometry.
import { PALETTE } from "../scene-palette";

const STEPS = [PALETTE.shade1, PALETTE.shade2, PALETTE.shade3, PALETTE.shade4, PALETTE.shade5];

/** One colour per position: of its step when there is a map, else the modules' blue. */
export function glassColoursOf(positions: number, steps: readonly number[] | null): string[] {
  return Array.from({ length: positions }, (_, index) => (steps ? (STEPS[steps[index] ?? 0] ?? PALETTE.shade1) : PALETTE.moduleGlass));
}
