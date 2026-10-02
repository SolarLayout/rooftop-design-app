import { describe, expect, test } from "bun:test";
import { PALETTE } from "../scene-palette";
import { glassColoursOf, shadeColoursOf } from "./shade-colours";

// The glass of each position (plan/phase-06-plan.md, decision 12; plan/phase-07-plan.md, step 13): the modules'
// blue, or a colour per position from what the stage colours the glass by, the shade map's steps or the strings;
// one per position, so that the colours are written and not the geometry.
describe("the colours of the glass", () => {
  test("without colours, every position is the modules' blue", () => {
    expect(glassColoursOf(3, null)).toEqual([PALETTE.moduleGlass, PALETTE.moduleGlass, PALETTE.moduleGlass]);
  });

  test("with a colour per position, each position takes its own", () => {
    expect(glassColoursOf(3, [PALETTE.series1, PALETTE.moduleUnused, PALETTE.series6])).toEqual([PALETTE.series1, PALETTE.moduleUnused, PALETTE.series6]);
  });

  test("colours of another count of positions are not taken: the modules stay their blue", () => {
    expect(glassColoursOf(2, [PALETTE.series1, PALETTE.series2, PALETTE.series3])).toEqual([PALETTE.moduleGlass, PALETTE.moduleGlass]);
  });

  test("the shade map gives each position the colour of its step, from the first to the fifth", () => {
    expect(shadeColoursOf([0, 3, 4])).toEqual([PALETTE.shade1, PALETTE.shade4, PALETTE.shade5]);
  });
});
