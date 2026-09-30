import { describe, expect, test } from "bun:test";
import { cameraOf, cameraRequestOf, createViewStore, lensOf, northRequestOf, selectionOf, sunTimeOf, toReviewOf } from "./view-store";

describe("the view", () => {
  test("it begins on the first lens, in 3D, on the design day", () => {
    const state = createViewStore().getState();

    expect(lensOf(state)).toBe("roof");
    expect(cameraOf(state)).toBe("3d");
    expect(sunTimeOf(state)).toEqual({ day: "design_day", hour: 10.5 });
  });

  test("the lens that was opened is kept", () => {
    const store = createViewStore();

    store.getState().showLens("strings");

    expect(lensOf(store.getState())).toBe("strings");
  });

  test("the camera goes to a preset, and each request counts, so that Fit frames again", () => {
    const store = createViewStore();
    const before = cameraRequestOf(store.getState());

    store.getState().setCamera("plan");
    store.getState().setCamera("plan");

    expect(cameraOf(store.getState())).toBe("plan");
    expect(cameraRequestOf(store.getState())).toBe(before + 2);
  });

  test("the north control asks the camera to turn north up, and each request counts, so that it turns again", () => {
    const store = createViewStore();
    const before = northRequestOf(store.getState());

    store.getState().turnNorthUp();
    store.getState().turnNorthUp();

    expect(northRequestOf(store.getState())).toBe(before + 2);
    expect(cameraOf(store.getState())).toBe("3d");
  });

  test("the time of the sun is a day and an hour in solar time", () => {
    const store = createViewStore();

    store.getState().setSunTime({ day: 172, hour: 16 });

    expect(sunTimeOf(store.getState())).toEqual({ day: 172, hour: 16 });
  });

  test.each([
    [{ day: 172, hour: 24.5 }, "24.5 is no hour of a day: from 0 to 24."],
    [{ day: 172, hour: -1 }, "-1 is no hour of a day: from 0 to 24."],
    [{ day: 172, hour: Number.NaN }, "NaN is no hour of a day: from 0 to 24."],
    [{ day: 0, hour: 12 }, "0 is no day of a year: from 1 to 366, or the design day."],
    [{ day: 367, hour: 12 }, "367 is no day of a year: from 1 to 366, or the design day."],
    [{ day: 1.5, hour: 12 }, "1.5 is no day of a year: from 1 to 366, or the design day."],
  ] as const)("a time that is none is refused: %o", (sunTime, why) => {
    const store = createViewStore();

    expect(() => store.getState().setSunTime(sunTime)).toThrow(why);
    expect(sunTimeOf(store.getState())).toEqual({ day: "design_day", hour: 10.5 });
  });

  test("a change of one leaves the others", () => {
    const store = createViewStore();
    store.getState().showLens("sun");
    store.getState().setSunTime({ day: "design_day", hour: 9 });

    store.getState().setCamera("sun-eye");

    expect(lensOf(store.getState())).toBe("sun");
    expect(sunTimeOf(store.getState())).toEqual({ day: "design_day", hour: 9 });
  });
});

// What is selected on the roof (plan/phase-05-plan.md, decision 10): the list and the scene read the same.
describe("the selection", () => {
  test("nothing is selected at the start", () => {
    expect(selectionOf(createViewStore().getState())).toBeNull();
  });

  test("an obstacle, a kept-clear area or a module is selected by its index; the roof by itself", () => {
    const store = createViewStore();

    store.getState().select({ kind: "obstacle", index: 2 });
    expect(selectionOf(store.getState())).toEqual({ kind: "obstacle", index: 2 });

    store.getState().select({ kind: "keepout", index: 0 });
    expect(selectionOf(store.getState())).toEqual({ kind: "keepout", index: 0 });

    store.getState().select({ kind: "roof" });
    expect(selectionOf(store.getState())).toEqual({ kind: "roof" });
  });

  test("selecting what is selected leaves it selected; select null clears", () => {
    const store = createViewStore();
    store.getState().select({ kind: "module", index: 5 });

    store.getState().select({ kind: "module", index: 5 });
    expect(selectionOf(store.getState())).toEqual({ kind: "module", index: 5 });

    store.getState().select(null);
    expect(selectionOf(store.getState())).toBeNull();
  });

  test("another design opened clears the selection", () => {
    const store = createViewStore();
    store.getState().select({ kind: "obstacle", index: 0 });

    store.getState().clearSelection();

    expect(selectionOf(store.getState())).toBeNull();
  });
});

// The heights a drawing could not give (plan/phase-05-plan.md, decision 13): the names of the obstacles that
// got 1.0 m, reviewed one by one in the Roof lens.
describe("the heights to review", () => {
  test("none at the start; the import sets them; a typed height takes one off", () => {
    const store = createViewStore();
    expect(toReviewOf(store.getState())).toEqual([]);

    store.getState().setToReview(["Lift shaft", "Plant room", "Skylight"]);
    store.getState().reviewed("Plant room");

    expect(toReviewOf(store.getState())).toEqual(["Lift shaft", "Skylight"]);
  });

  test("a name that is not on the list changes nothing", () => {
    const store = createViewStore();
    store.getState().setToReview(["Lift shaft"]);
    const before = store.getState();

    store.getState().reviewed("Vent");

    expect(store.getState()).toBe(before);
  });
});
