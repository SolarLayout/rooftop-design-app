import { describe, expect, test } from "bun:test";
import { scaleOf, shadeMapOf, stepOf } from "./shade-map";

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
