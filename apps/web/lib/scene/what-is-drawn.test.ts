import { describe, expect, test } from "bun:test";
import { whatIsDrawnOf } from "./what-is-drawn";

// What the stage draws by lens (the boards "Studio, Sun lens": the Sun lens has no kept-clear areas and no edge
// labels in 3D; plan/phase-06-plan.md, step 9). The plan keeps its labels: it is the view things are measured in.
describe("what the stage draws", () => {
  test("in the Roof and Array lenses, the kept-clear areas and the edge labels", () => {
    expect(whatIsDrawnOf("array", "3d")).toEqual({ keptClear: true, edgeLabels: true });
    expect(whatIsDrawnOf("roof", "plan")).toEqual({ keptClear: true, edgeLabels: true });
  });

  test("in the Sun lens, neither in 3D; in the plan the edge labels alone", () => {
    expect(whatIsDrawnOf("sun", "3d")).toEqual({ keptClear: false, edgeLabels: false });
    expect(whatIsDrawnOf("sun", "sun-eye")).toEqual({ keptClear: false, edgeLabels: false });
    expect(whatIsDrawnOf("sun", "plan")).toEqual({ keptClear: false, edgeLabels: true });
  });
});
