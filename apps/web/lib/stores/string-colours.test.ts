import { describe, expect, test } from "bun:test";
import { PALETTE } from "../geometry/scene-palette";
import { categoryOf, mixedToward, seriesColourOf, stringColoursOf, stringsOfTheRunOf, type Wired } from "./string-colours";

// The strings on the roof (plan/phase-07-plan.md, step 13, decision 12): every position of the layout in the
// colour of its string, of its MPPT or of its inverter, in the series colours in their fixed order; the positions
// the option does not use grey; only while the run is of the layout shown. A string traced or selected is white and
// the rest dimmed (decision 13). The strings are a few of the demo's option A and D (strings_lens_data.json), cut short.

const string = (label: string, modules: number[], inverter = 1, mppt = 1): Wired => ({ label, modules, inverter, mppt });

/** Fourteen strings of two positions each, on 30 positions: 28 used, the last two not. */
const FOURTEEN = Array.from({ length: 14 }, (_, n) => string(`S${n + 1}`, [2 * n, 2 * n + 1], 1, Math.floor(n / 3) + 1));
const IDXS = Array.from({ length: 30 }, (_, n) => n);

const SERIES = [PALETTE.series1, PALETTE.series2, PALETTE.series3, PALETTE.series4, PALETTE.series5, PALETTE.series6];

describe("the series colour of a category", () => {
  test("goes through the six in their fixed order and round again: the first is series 1, the seventh too", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 12, 13].map(seriesColourOf)).toEqual([...SERIES, PALETTE.series1, PALETTE.series6, PALETTE.series1]);
  });

  test("a string's category is the number of its label, its MPPT's or its inverter's", () => {
    const s12 = string("S12", [0], 2, 3);
    expect(categoryOf(s12, "string")).toBe(12);
    expect(categoryOf(s12, "mppt")).toBe(3);
    expect(categoryOf(s12, "inverter")).toBe(2);
  });
});

describe("the colours of the positions by string", () => {
  const colours = stringColoursOf({ idxs: IDXS, strings: FOURTEEN, colouring: "string", lit: [] });

  test("S1 and S7 are the same colour, S1 and S2 not; S12 is the sixth", () => {
    expect(colours[0]).toBe(PALETTE.series1);
    expect(colours[12]).toBe(PALETTE.series1);
    expect(colours[2]).toBe(PALETTE.series2);
    expect(colours[22]).toBe(PALETTE.series6);
    expect(colours[23]).toBe(PALETTE.series6);
  });

  test("the positions the option does not use are grey", () => {
    expect(colours.slice(28)).toEqual([PALETTE.moduleUnused, PALETTE.moduleUnused]);
    expect(colours.filter((colour) => colour === PALETTE.moduleUnused)).toHaveLength(2);
  });

  test("a string's colour follows its label, whatever its rank: the same strings in another order colour the same", () => {
    // The engine may list the least shaded first; S12 stays the sixth colour and S1 the first.
    const reordered = [...FOURTEEN].reverse();
    expect(stringColoursOf({ idxs: IDXS, strings: reordered, colouring: "string", lit: [] })).toEqual(colours);
    const moved = [string("S12", [0, 1]), string("S1", [22, 23])];
    const again = stringColoursOf({ idxs: IDXS, strings: moved, colouring: "string", lit: [] });
    expect(again[0]).toBe(PALETTE.series6);
    expect(again[22]).toBe(PALETTE.series1);
  });

  test("the positions are of the layout's order, found by their idx", () => {
    const backwards = [...IDXS].reverse();
    const reversed = stringColoursOf({ idxs: backwards, strings: FOURTEEN, colouring: "string", lit: [] });
    expect(reversed[29]).toBe(PALETTE.series1);
    expect(reversed[0]).toBe(PALETTE.moduleUnused);
  });
});

describe("the colours of the positions by MPPT and by inverter", () => {
  // Option D's way: two inverters of six MPPTs each.
  const two = [string("S1", [0], 1, 1), string("S2", [1], 1, 3), string("S15", [2], 2, 1), string("S20", [3], 2, 3)];
  const idxs = [0, 1, 2, 3, 4];

  test("by MPPT, MPPT 3 of INV-2 is the colour of MPPT 3 of INV-1", () => {
    const colours = stringColoursOf({ idxs, strings: two, colouring: "mppt", lit: [] });
    expect(colours).toEqual([PALETTE.series1, PALETTE.series3, PALETTE.series1, PALETTE.series3, PALETTE.moduleUnused]);
  });

  test("by inverter, each inverter its colour", () => {
    const colours = stringColoursOf({ idxs, strings: two, colouring: "inverter", lit: [] });
    expect(colours).toEqual([PALETTE.series1, PALETTE.series1, PALETTE.series2, PALETTE.series2, PALETTE.moduleUnused]);
  });
});

describe("a string traced or selected", () => {
  test("its positions are white; every other position, used or not, its colour mixed 55 % toward the stage", () => {
    const colours = stringColoursOf({ idxs: IDXS, strings: FOURTEEN, colouring: "string", lit: ["S2"] });
    expect(colours[2]).toBe(PALETTE.stringSelected);
    expect(colours[3]).toBe(PALETTE.stringSelected);
    expect(colours[0]).toBe(mixedToward(PALETTE.series1, PALETTE.stage, 0.55));
    expect(colours[29]).toBe(mixedToward(PALETTE.moduleUnused, PALETTE.stage, 0.55));
  });

  test("two lit at once, the one traced and the one selected, are both white", () => {
    const colours = stringColoursOf({ idxs: IDXS, strings: FOURTEEN, colouring: "mppt", lit: ["S1", "S14"] });
    expect([colours[0], colours[1], colours[26], colours[27]]).toEqual(Array(4).fill(PALETTE.stringSelected));
  });

  test("a label the option has not leaves the colours undimmed", () => {
    expect(stringColoursOf({ idxs: IDXS, strings: FOURTEEN, colouring: "string", lit: ["S40"] })).toEqual(stringColoursOf({ idxs: IDXS, strings: FOURTEEN, colouring: "string", lit: [] }));
  });

  test("mixing goes the share of the way from one colour to the other, rounded", () => {
    expect(mixedToward("#FFFFFF", "#000000", 0.55)).toBe("#737373");
    expect(mixedToward(PALETTE.series1, PALETTE.stage, 0)).toBe(PALETTE.series1);
    expect(mixedToward(PALETTE.series1, PALETTE.stage, 1)).toBe(PALETTE.stage);
  });
});

describe("the strings of the run", () => {
  const strings = [...FOURTEEN];
  const option = { system: { strings } };

  test("are drawn while the run is of the layout shown: its edit not older, its count of positions the same", () => {
    expect(stringsOfTheRunOf({ option, runEdit: 4, layoutEdit: 4, runPositions: 30, positions: 30 })).toBe(strings);
    expect(stringsOfTheRunOf({ option, runEdit: 5, layoutEdit: 4, runPositions: 30, positions: 30 })).toBe(strings);
  });

  test("are none for a run of another layout, before a run or without an option", () => {
    expect(stringsOfTheRunOf({ option, runEdit: 3, layoutEdit: 4, runPositions: 30, positions: 30 })).toBeNull();
    expect(stringsOfTheRunOf({ option, runEdit: 4, layoutEdit: 4, runPositions: 31, positions: 30 })).toBeNull();
    expect(stringsOfTheRunOf({ option, runEdit: null, layoutEdit: 4, runPositions: 30, positions: 30 })).toBeNull();
    expect(stringsOfTheRunOf({ option: null, runEdit: 4, layoutEdit: 4, runPositions: 30, positions: 30 })).toBeNull();
  });
});
