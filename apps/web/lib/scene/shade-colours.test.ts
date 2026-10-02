import { describe, expect, test } from "bun:test";
import { PALETTE } from "../scene-palette";
import { glassColoursOf } from "./shade-colours";

// The glass of each position (plan/phase-06-plan.md, decision 12): the modules' blue, or the colour of its step
// of the shade map while the map is shown; one per position, so that the colours are written and not the geometry.
describe("the colours of the glass", () => {
  test("without a map, every position is the modules' blue", () => {
    expect(glassColoursOf(3, null)).toEqual([PALETTE.moduleGlass, PALETTE.moduleGlass, PALETTE.moduleGlass]);
  });

  test("with a map, each position takes the colour of its step, from the first to the fifth", () => {
    expect(glassColoursOf(3, [0, 3, 4])).toEqual([PALETTE.shade1, PALETTE.shade4, PALETTE.shade5]);
  });
});
