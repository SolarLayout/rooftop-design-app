import { describe, expect, test } from "bun:test";
import { legendOf, scaleOf, shadeCalloutOf, shadeMapOf, shadeMapWordsOf, stepOf } from "./shade-map";

// The shade map (plan/phase-06-plan.md, decisions 11 and 12): each position by its near shading over the
// year, in five steps from 0 to the next round value over the largest loss.

describe("the scale", () => {
  test.each([
    [3.592, 5],
    [0.4, 1],
    [1, 1],
    [1.2, 2],
    [7, 10],
    [18, 20],
    [0, 1],
  ])("over a largest loss of %d % it runs to %d %", (largest, top) => {
    expect(scaleOf([0.1, largest])).toEqual({ top, steps: 5 });
  });
});

describe("the step of a position", () => {
  const scale = { top: 5, steps: 5 };

  test.each([
    [0.026, 0],
    [0.999, 0],
    [1, 1],
    [3.592, 3],
    [4.99, 4],
    [5, 4],
  ])("%d % is the step %d", (loss, step) => {
    expect(stepOf(loss, scale)).toBe(step);
  });
});

describe("the map of a design run", () => {
  const losses = [0.03, 3.592, 1.2];

  test("is the step of every position when the run is of the layout shown", () => {
    expect(shadeMapOf({ losses, runEdit: 4, layoutEdit: 4, positions: 3 })).toEqual({ scale: { top: 5, steps: 5 }, steps: [0, 3, 1], counts: [1, 1, 0, 1, 0] });
  });

  test("a run newer than the layout is of it too: the layout of an edit that moved nothing", () => {
    expect(shadeMapOf({ losses, runEdit: 5, layoutEdit: 4, positions: 3 })).not.toBeNull();
  });

  test("is none when the layout is newer than the run: it would colour the wrong modules", () => {
    expect(shadeMapOf({ losses, runEdit: 3, layoutEdit: 4, positions: 3 })).toBeNull();
  });

  test("is none when the run counts other positions than the layout", () => {
    expect(shadeMapOf({ losses, runEdit: 4, layoutEdit: 4, positions: 2 })).toBeNull();
  });
});

// A selected module in the shade map (plan/phase-06-plan.md, decision 14; the board "Shade map").
describe("the callout of a module in the shade map", () => {
  const position = { idx: 422, row: 3 } as never;
  const OPTION_A = { letter: "A", system: { strings: [{ label: "S11", modules: [400, 401], shade_pct: 0.81 }, { label: "S12", modules: [420, 422], shade_pct: 4.995 }] } } as never;

  test("says its position and row, its loss over the year, and its string with the string's shade", () => {
    expect(shadeCalloutOf(position, "flat_tilted", 3.567, OPTION_A)).toEqual({ title: "Position 423 · row 4", detail: "Near shading 3.57 % over the year · string S12, 5.00 %" });
  });

  test("a module the option does not wire says so", () => {
    expect(shadeCalloutOf({ idx: 297, row: 2 } as never, "flat_tilted", 3.592, OPTION_A)).toEqual({ title: "Position 298 · row 3", detail: "Near shading 3.59 % over the year · not used by option A" });
  });

  test("without an option there is no string to say", () => {
    expect(shadeCalloutOf(position, "flat_tilted", 3.567, null).detail).toBe("Near shading 3.57 % over the year");
  });

  test("on an east-west roof a row is a unit", () => {
    expect(shadeCalloutOf(position, "flat_ew", 0.5, null).title).toBe("Position 423 · unit 4");
  });
});

// The legend of the shade map on the stage (the board "Shade map").
describe("the legend", () => {
  test("says what is coloured, the scale's marks and what it counts", () => {
    expect(legendOf({ scale: { top: 5, steps: 5 }, steps: [], counts: [776, 10, 2, 2, 0] }, 790)).toEqual({
      title: "Near shading over the year",
      marks: ["0", "1", "2", "3", "4", "5 %"],
      of: "Of all 790 positions",
    });
  });

  test("on a scale to 2 % the marks go by 0.4", () => {
    expect(legendOf({ scale: { top: 2, steps: 5 }, steps: [], counts: [] }, 12).marks).toEqual(["0", "0.4", "0.8", "1.2", "1.6", "2 %"]);
  });

  test("without a map it waits for the run", () => {
    expect(legendOf(null, 790)).toEqual({ title: "Near shading over the year", marks: [], of: "The shade map follows the design run" });
  });
});

describe("the shade map in words", () => {
  test("says the scale and how many positions are in each step", () => {
    expect(shadeMapWordsOf({ scale: { top: 5, steps: 5 }, steps: [], counts: [776, 10, 2, 2, 0] })).toBe(
      "The shade map: near shading over the year from 0 to 5 %, by steps of 1 %: 776, 10, 2, 2 and 0 positions",
    );
  });

  test("without a map, that it follows the run", () => {
    expect(shadeMapWordsOf(null)).toBe("The shade map follows the design run");
  });
});
