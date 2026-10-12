import { describe, expect, test } from "bun:test";
import { whatIsDrawnOf } from "./what-is-drawn";

// What the stage draws by view (the boards "Studio, Sun lens", kept by "V2 · 7": the Sun view has no kept-clear areas and
// no edge labels in 3D; plan/phase-06-plan.md, step 9). The plan keeps its labels: it is the view things are measured in.
describe("what the stage draws", () => {
  test("outside the Sun view, the kept-clear areas and the edge labels", () => {
    expect(whatIsDrawnOf(false, "3d")).toEqual({ keptClear: true, edgeLabels: true });
    expect(whatIsDrawnOf(false, "plan")).toEqual({ keptClear: true, edgeLabels: true });
  });

  test("in the Sun view, neither in 3D; in the plan the edge labels alone", () => {
    expect(whatIsDrawnOf(true, "3d")).toEqual({ keptClear: false, edgeLabels: false });
    expect(whatIsDrawnOf(true, "sun-eye")).toEqual({ keptClear: false, edgeLabels: false });
    expect(whatIsDrawnOf(true, "plan")).toEqual({ keptClear: false, edgeLabels: true });
  });
});
