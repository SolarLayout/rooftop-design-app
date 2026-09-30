import { describe, expect, test } from "bun:test";
import { bearingDegOf, createStageStore, labelsOf } from "./stage-store";

// What the scene tells the DOM over it, written on each drawn frame: it must not wake React for nothing.

describe("the stage store", () => {
  test("it begins with no labels, looking north", () => {
    const state = createStageStore().getState();

    expect(labelsOf(state)).toEqual([]);
    expect(bearingDegOf(state)).toBe(0);
  });

  test("labels that are the same, to the pixel, leave the state as it is", () => {
    const store = createStageStore();
    const label = { words: "90.0 m", x: 100.2, y: 50.4, visible: true };
    store.getState().setLabels([label]);
    const before = labelsOf(store.getState());

    store.getState().setLabels([{ ...label, x: 100.4 }]);

    expect(labelsOf(store.getState())).toBe(before);
  });

  test("labels that moved are taken", () => {
    const store = createStageStore();
    store.getState().setLabels([{ words: "90.0 m", x: 100, y: 50, visible: true }]);

    store.getState().setLabels([{ words: "90.0 m", x: 120, y: 50, visible: true }]);

    expect(labelsOf(store.getState())).toEqual([{ words: "90.0 m", x: 120, y: 50, visible: true }]);
  });

  test("a bearing that is the same to a tenth of a degree leaves the state as it is; one that turned is taken", () => {
    const store = createStageStore();
    store.getState().setBearing(45.94);
    const before = store.getState();

    store.getState().setBearing(45.91);
    expect(store.getState()).toBe(before);

    store.getState().setBearing(46.2);
    expect(bearingDegOf(store.getState())).toBe(46.2);
  });
});
