import { describe, expect, test } from "bun:test";
import { committed, numberOf, saidOf, shown, stepped, withUnit, type Range } from "./number-entry";

const SETBACK: Range = { min: 0, max: 5, decimals: 2 };
const MODULES_IN_TILT: Range = { min: 1, max: 4, decimals: 0, step: 1 };

describe("shown: a number as the field shows it", () => {
  test.each([
    [1, 2, "1.00"],
    [0.5, 2, "0.50"],
    [1.255, 2, "1.26"],
    [15, 0, "15"],
    [1729, 0, "1,729"],
    [1234567.891, 1, "1,234,567.9"],
    [-2.22, 2, "−2.22"],
    [-0.001, 2, "0.00"],
    [0, 1, "0.0"],
  ])("%d with %d decimals is %s", (value, decimals, text) => {
    expect(shown(value, decimals)).toBe(text);
  });
});

describe("numberOf: what was typed, as a number", () => {
  test.each([
    ["1.25", 1.25],
    [" 1.25 ", 1.25],
    ["1", 1],
    [".5", 0.5],
    ["5.", 5],
    ["-2.22", -2.22],
    ["−2.22", -2.22],
    ["+3", 3],
    ["1,729", 1729],
    ["1,234,567.9", 1234567.9],
    ["0", 0],
  ])("%s is %d", (text, value) => {
    expect(numberOf(text)).toBe(value);
  });

  test.each(["", " ", "abc", "1.2.3", "1,25", "12,3456", "1e5", "--1", "1-", "Infinity", "NaN", "0x10", "1 000", ".", "-"])(
    '"%s" is not a number',
    (text) => {
      expect(numberOf(text)).toBeNull();
    },
  );
});

describe("committed: what Enter or leaving the field makes of the draft", () => {
  test("a number inside the range is taken, with the decimals of the field", () => {
    expect(committed("1.25", 1, SETBACK)).toEqual({ value: 1.25, text: "1.25", correction: null });
    expect(committed("1.256", 1, SETBACK)).toEqual({ value: 1.26, text: "1.26", correction: null });
    expect(committed("2", 1, SETBACK)).toEqual({ value: 2, text: "2.00", correction: null });
  });

  test("a number above the range is brought to the highest, and the field says so", () => {
    expect(committed("7", 1, SETBACK)).toEqual({ value: 5, text: "5.00", correction: "highest" });
  });

  test("a number below the range is brought to the lowest, and the field says so", () => {
    expect(committed("-1", 1, SETBACK)).toEqual({ value: 0, text: "0.00", correction: "lowest" });
  });

  test("what is not a number leaves the value as it was, and the field says so", () => {
    expect(committed("abc", 1.25, SETBACK)).toEqual({ value: 1.25, text: "1.25", correction: "not-a-number" });
    expect(committed("", 1.25, SETBACK)).toEqual({ value: 1.25, text: "1.25", correction: "not-a-number" });
  });

  test("a range may be open at either end", () => {
    expect(committed("-40", 0, { decimals: 1 })).toEqual({ value: -40, text: "−40.0", correction: null });
    expect(committed("9000", 0, { min: 0, decimals: 0 })).toEqual({ value: 9000, text: "9,000", correction: null });
  });

  test("a field of whole numbers rounds what is typed", () => {
    expect(committed("2.6", 2, MODULES_IN_TILT)).toEqual({ value: 3, text: "3", correction: null });
  });

  test("a number that rounds to the limit is inside the range", () => {
    expect(committed("5.004", 1, SETBACK)).toEqual({ value: 5, text: "5.00", correction: null });
  });
});

describe("stepped: one step up or down", () => {
  test("goes by the step of the field", () => {
    expect(stepped(2, "up", MODULES_IN_TILT)).toBe(3);
    expect(stepped(2, "down", MODULES_IN_TILT)).toBe(1);
    expect(stepped(1, "up", { ...SETBACK, step: 0.25 })).toBe(1.25);
  });

  test("stops at the ends of the range", () => {
    expect(stepped(4, "up", MODULES_IN_TILT)).toBe(4);
    expect(stepped(1, "down", MODULES_IN_TILT)).toBe(1);
    expect(stepped(4.9, "up", { ...SETBACK, step: 0.25 })).toBe(5);
  });

  test("steps of tenths add up without the dust of floating point", () => {
    expect(stepped(0.1, "up", { min: 0, max: 1, decimals: 1, step: 0.1 })).toBe(0.2);
    expect(stepped(0.2, "up", { min: 0, max: 1, decimals: 1, step: 0.1 })).toBe(0.3);
  });

  test("without a step of its own a field goes by its last decimal", () => {
    expect(stepped(1, "up", SETBACK)).toBe(1.01);
    expect(stepped(15, "down", { decimals: 0 })).toBe(14);
  });
});

describe("saidOf: what the field says after it changed the entry", () => {
  test("nothing, when the entry was taken as it was", () => {
    expect(saidOf(null, SETBACK, "m")).toBeNull();
  });

  test("the limit it was brought to, with the unit", () => {
    expect(saidOf("highest", SETBACK, "m")).toBe("The highest is 5.00 m.");
    expect(saidOf("lowest", SETBACK, "m")).toBe("The lowest is 0.00 m.");
    expect(saidOf("highest", MODULES_IN_TILT)).toBe("The highest is 4.");
  });

  test("the degree sign follows its number without a space", () => {
    expect(saidOf("highest", { min: 0, max: 45, decimals: 0 }, "°")).toBe("The highest is 45°.");
  });

  test("what to enter, when the entry was no number", () => {
    expect(saidOf("not-a-number", SETBACK, "m")).toBe("Enter a number from 0.00 to 5.00 m.");
    expect(saidOf("not-a-number", { min: 0, decimals: 1 }, "m")).toBe("Enter 0.0 m or more.");
    expect(saidOf("not-a-number", { max: 60, decimals: 0 }, "°")).toBe("Enter 60° or less.");
    expect(saidOf("not-a-number", { decimals: 1 })).toBe("Enter a number.");
  });
});

describe("withUnit: a number with its unit", () => {
  test("a space between the number and the unit", () => {
    expect(withUnit("0.50", "m")).toBe("0.50 m");
    expect(withUnit("86.6", "%")).toBe("86.6 %");
  });

  test("none before the degree sign", () => {
    expect(withUnit("15", "°")).toBe("15°");
  });

  test("without a unit, the number alone", () => {
    expect(withUnit("2", undefined)).toBe("2");
  });
});
