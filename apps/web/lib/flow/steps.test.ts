import { describe, expect, test } from "bun:test";
import { nextStepOf, pathOfStep, STEPS, stepOfPath, stepStatesOf, waitingStepsOf, type StepFacts } from "./steps";

// One order of work (D95; the board "V2 · 2"): Roof, Array, Strings, Performance, Handover, each with its state.

const facts = (over: Partial<StepFacts> = {}): StepFacts => ({ current: "roof", seen: [], waiting: [], hasDesign: true, ...over });

describe("the steps", () => {
  test("five, in the order of the work, each with its place", () => {
    expect(STEPS.map((step) => step.name)).toEqual(["Roof", "Array", "Strings", "Performance", "Handover"]);
    expect(STEPS.map((step) => pathOfStep(step.id))).toEqual(["/studio/roof", "/studio/array", "/studio/strings", "/performance", "/handover"]);
  });

  test("the step an address is in: Find is the first part of Roof; the Sun view is no step", () => {
    expect(stepOfPath("/find")).toBe("roof");
    expect(stepOfPath("/studio/roof")).toBe("roof");
    expect(stepOfPath("/studio/array")).toBe("array");
    expect(stepOfPath("/studio/strings")).toBe("strings");
    expect(stepOfPath("/performance")).toBe("performance");
    expect(stepOfPath("/handover/report")).toBe("handover");
    expect(stepOfPath("/")).toBeNull();
    expect(stepOfPath("/studio/sun")).toBeNull();
  });

  test("the next step of each, and none after Handover", () => {
    expect(STEPS.map((step) => nextStepOf(step.id))).toEqual(["array", "strings", "performance", "handover", null]);
  });

  test("a step is done once the user has gone past it and nothing in it waits; else to do", () => {
    const states = stepStatesOf(facts({ current: "strings", seen: ["roof", "array", "strings"] }));
    expect(states).toEqual({ roof: "done", array: "done", strings: "to-do", performance: "to-do", handover: "to-do" });
  });

  test("a step that waits for the user needs them, whether or not it was gone past", () => {
    const states = stepStatesOf(facts({ current: "performance", seen: ["roof", "array", "strings", "performance"], waiting: ["strings"] }));
    expect(states.strings).toBe("needs-you");
    const ahead = stepStatesOf(facts({ current: "roof", seen: ["roof"], waiting: ["strings"] }));
    expect(ahead.strings).toBe("needs-you");
  });

  test("the step where the user is shows its own state: needs you when it waits, done when gone past and come back to", () => {
    expect(stepStatesOf(facts({ current: "strings", seen: ["strings"], waiting: ["strings"] })).strings).toBe("needs-you");
    expect(stepStatesOf(facts({ current: "roof", seen: ["roof", "array", "strings"] })).roof).toBe("done");
  });

  test("before there is a design, on Find, the steps after Roof cannot be gone to", () => {
    const states = stepStatesOf(facts({ current: "roof", hasDesign: false }));
    expect(states).toEqual({ roof: "to-do", array: "closed", strings: "closed", performance: "closed", handover: "closed" });
  });
});

describe("the steps that wait for the user", () => {
  test("the step of each note that leads somewhere, once; no options waits on Strings", () => {
    const notes = [
      { action: { kind: "open", path: "/studio/array" } },
      { action: { kind: "open", path: "/studio/array" } },
      { action: { kind: "try-again" } },
      { action: { kind: "open", path: "/performance" } },
    ];
    expect(waitingStepsOf(notes, false)).toEqual(["array", "performance"]);
    expect(waitingStepsOf([], true)).toEqual(["strings"]);
  });
});
