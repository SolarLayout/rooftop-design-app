import { describe, expect, test } from "bun:test";
import { cameraOf, createViewStore, lensOf, sunTimeOf } from "./view-store";

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

  test("the camera goes to a preset", () => {
    const store = createViewStore();

    store.getState().setCamera("plan");

    expect(cameraOf(store.getState())).toBe("plan");
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
