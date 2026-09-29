import { describe, expect, test } from "bun:test";
import { indexAfterKey, indexOfTyped } from "./list-keys";

const WEATHER = ["PVGIS TMY", "NASA POWER", "CSV file"];
const NONE = new Set<number>();

describe("indexAfterKey: where a key leads in a list", () => {
  test.each([
    ["ArrowDown", 0, 1],
    ["ArrowDown", 1, 2],
    ["ArrowUp", 2, 1],
    ["ArrowUp", 1, 0],
    ["Home", 2, 0],
    ["End", 0, 2],
  ])("%s from %d goes to %d", (key, from, to) => {
    expect(indexAfterKey(WEATHER.length, from, key, NONE)).toBe(to);
  });

  test("a list has ends: the arrows stop at them", () => {
    expect(indexAfterKey(3, 2, "ArrowDown", NONE)).toBeNull();
    expect(indexAfterKey(3, 0, "ArrowUp", NONE)).toBeNull();
  });

  test("a row that cannot be taken is passed over", () => {
    expect(indexAfterKey(3, 0, "ArrowDown", new Set([1]))).toBe(2);
    expect(indexAfterKey(3, 2, "ArrowUp", new Set([1]))).toBe(0);
    expect(indexAfterKey(3, 2, "Home", new Set([0]))).toBe(1);
    expect(indexAfterKey(3, 0, "End", new Set([2]))).toBe(1);
  });

  test("behind the last that can be taken there is nothing", () => {
    expect(indexAfterKey(3, 1, "ArrowDown", new Set([2]))).toBeNull();
    expect(indexAfterKey(3, 1, "ArrowUp", new Set([0]))).toBeNull();
  });

  test("with no row marked yet, down leads to the first and up to the last", () => {
    expect(indexAfterKey(3, null, "ArrowDown", NONE)).toBe(0);
    expect(indexAfterKey(3, null, "ArrowUp", NONE)).toBe(2);
    expect(indexAfterKey(3, null, "ArrowDown", new Set([0]))).toBe(1);
  });

  test("any other key leads nowhere", () => {
    expect(indexAfterKey(3, 1, "Enter", NONE)).toBeNull();
    expect(indexAfterKey(3, 1, "a", NONE)).toBeNull();
    expect(indexAfterKey(3, 1, "ArrowRight", NONE)).toBeNull();
  });

  test("an empty list leads nowhere", () => {
    expect(indexAfterKey(0, null, "ArrowDown", NONE)).toBeNull();
    expect(indexAfterKey(0, null, "End", NONE)).toBeNull();
  });
});

describe("indexOfTyped: the row that begins with what was typed", () => {
  test("large and small letters are the same", () => {
    expect(indexOfTyped(WEATHER, "n", 0, NONE)).toBe(1);
    expect(indexOfTyped(WEATHER, "CSV", 0, NONE)).toBe(2);
    expect(indexOfTyped(WEATHER, "pv", 2, NONE)).toBe(0);
  });

  test("the same letter again leads to the next row that begins with it", () => {
    const rows = ["600 V", "1000 V", "1500 V"];

    expect(indexOfTyped(rows, "1", 0, NONE)).toBe(1);
    expect(indexOfTyped(rows, "1", 1, NONE)).toBe(2);
    expect(indexOfTyped(rows, "1", 2, NONE)).toBe(1);
  });

  test("more letters stay on the row that begins with them", () => {
    const rows = ["600 V", "1000 V", "1500 V"];

    expect(indexOfTyped(rows, "15", 1, NONE)).toBe(2);
    expect(indexOfTyped(rows, "10", 1, NONE)).toBe(1);
  });

  test("a row that cannot be taken is not found", () => {
    expect(indexOfTyped(WEATHER, "n", 0, new Set([1]))).toBeNull();
  });

  test("what no row begins with finds nothing", () => {
    expect(indexOfTyped(WEATHER, "x", 0, NONE)).toBeNull();
    expect(indexOfTyped(WEATHER, "", 0, NONE)).toBeNull();
    expect(indexOfTyped([], "a", null, NONE)).toBeNull();
  });
});
