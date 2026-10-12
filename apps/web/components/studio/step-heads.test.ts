import { describe, expect, test } from "bun:test";
import { stepHeadOf } from "./step-heads";

// The head of each step's work column (V2 · 3, D97): the instruction and one line under it.

describe("the step's head", () => {
  test("Roof: check the roof, built from what the user gave", () => {
    expect(stepHeadOf("roof", "map")).toEqual({ title: "Check the roof", line: "Built from your outline. The app set the edges: check the parapet, it shades the first row." });
    expect(stepHeadOf("roof", "kmz").line).toBe("Built from your file. The app set the edges: check the parapet, it shades the first row.");
    expect(stepHeadOf("roof", "dxf").line).toBe("Built from your file. The app set the edges: check the parapet, it shades the first row.");
    expect(stepHeadOf("roof", "coordinates").line).toBe("Built from your corners. The app set the edges: check the parapet, it shades the first row.");
  });

  test("Array and Strings: their instruction and what they hold, as the board of the order of work says", () => {
    expect(stepHeadOf("array", "map")).toEqual({ title: "Choose the module", line: "The module, how it is mounted, how rows are spaced." });
    expect(stepHeadOf("strings", "map")).toEqual({ title: "Check the strings", line: "How the modules are wired to the inverter." });
  });
});
