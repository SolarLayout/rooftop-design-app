import { describe, expect, test } from "bun:test";
import { fileSetByOf, hintOf, sectionSetByOf, setByOfValue, wordOf, type SetBy } from "./set-by";

// Who set each value (V2 · 3, D97): four words, the same at the right of a section and in a field's hint, on every step.

const DEFAULT: SetBy = { kind: "default" };
const WEATHER: SetBy = { kind: "weather" };
const INDIA: SetBy = { kind: "country", country: "India" };
const YOURS: SetBy = { kind: "yours", byDefault: "0.90 m" };

describe("the words", () => {
  test("at the right of a section: Default, From the weather, Set for <country>, Yours", () => {
    expect([DEFAULT, WEATHER, INDIA, YOURS].map(wordOf)).toEqual(["Default", "From the weather", "Set for India", "Yours"]);
  });

  test("in a field's hint, the user's value says the default it took the place of", () => {
    expect(hintOf(YOURS)).toBe("Yours · default 0.90 m");
    expect(hintOf({ kind: "yours", byDefault: null })).toBe("Yours");
    expect([DEFAULT, WEATHER, INDIA].map(hintOf)).toEqual(["Default", "From the weather", "Set for India"]);
  });
});

describe("a value", () => {
  test("equal to its default at the field's decimals is the app's", () => {
    expect(setByOfValue(0.9, 0.9, { decimals: 2, unit: "m" })).toEqual(DEFAULT);
    expect(setByOfValue(0.9000001, 0.9, { decimals: 2, unit: "m" })).toEqual(DEFAULT);
  });

  test("another is the user's, with the default said with its unit", () => {
    expect(setByOfValue(1.2, 0.9, { decimals: 2, unit: "m" })).toEqual(YOURS);
    expect(setByOfValue(20, 15, { decimals: 0, unit: "°" })).toEqual({ kind: "yours", byDefault: "15°" });
    expect(setByOfValue("landscape", "portrait", { words: "portrait" })).toEqual({ kind: "yours", byDefault: "portrait" });
  });
});

describe("a section", () => {
  test("is the user's when any of its fields is", () => {
    expect(sectionSetByOf([DEFAULT, YOURS, WEATHER])).toEqual({ kind: "yours", byDefault: null });
  });

  test("else its source: what is not the app's own default first", () => {
    expect(sectionSetByOf([DEFAULT, WEATHER, DEFAULT])).toEqual(WEATHER);
    expect(sectionSetByOf([INDIA])).toEqual(INDIA);
    expect(sectionSetByOf([DEFAULT, DEFAULT])).toEqual(DEFAULT);
  });

  test("with no field says nothing", () => {
    expect(sectionSetByOf([])).toBeNull();
  });
});

describe("the equipment", () => {
  test("is the app's until the user reads a file of their own", () => {
    expect(fileSetByOf(null)).toEqual(DEFAULT);
    expect(fileSetByOf("")).toEqual(DEFAULT);
    expect(fileSetByOf("PVObject_=pvModule")).toEqual({ kind: "yours", byDefault: null });
  });
});
