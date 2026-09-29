import { describe, expect, test } from "bun:test";
import { choiceAfterKey } from "./choice-keys";

const DAYS = ["winter", "summer", "equinox"] as const;

describe("choiceAfterKey", () => {
  test.each([
    ["ArrowRight", "winter", "summer"],
    ["ArrowDown", "winter", "summer"],
    ["ArrowLeft", "summer", "winter"],
    ["ArrowUp", "summer", "winter"],
    ["Home", "equinox", "winter"],
    ["End", "winter", "equinox"],
  ] as const)("%s from %s goes to %s", (key, from, to) => {
    expect(choiceAfterKey(DAYS, from, key)).toBe(to);
  });

  test("after the last comes the first, before the first the last", () => {
    expect(choiceAfterKey(DAYS, "equinox", "ArrowRight")).toBe("winter");
    expect(choiceAfterKey(DAYS, "winter", "ArrowLeft")).toBe("equinox");
  });

  test("a choice that cannot be taken is passed over", () => {
    const unavailable = new Set(["summer"]);

    expect(choiceAfterKey(DAYS, "winter", "ArrowRight", unavailable)).toBe("equinox");
    expect(choiceAfterKey(DAYS, "equinox", "ArrowLeft", unavailable)).toBe("winter");
  });

  test("Home and End go to the first and the last that can be taken", () => {
    expect(choiceAfterKey(DAYS, "equinox", "Home", new Set(["winter"]))).toBe("summer");
    expect(choiceAfterKey(DAYS, "winter", "End", new Set(["equinox"]))).toBe("summer");
  });

  test("any other key changes nothing", () => {
    expect(choiceAfterKey(DAYS, "summer", "a")).toBeNull();
    expect(choiceAfterKey(DAYS, "summer", "Tab")).toBeNull();
    expect(choiceAfterKey(DAYS, "summer", "Enter")).toBeNull();
  });

  test("with nothing else to take, nothing changes", () => {
    expect(choiceAfterKey(DAYS, "winter", "ArrowRight", new Set(["summer", "equinox"]))).toBeNull();
    expect(choiceAfterKey(["only"], "only", "ArrowRight")).toBeNull();
  });

  test("a choice that is not among the choices goes to the first", () => {
    expect(choiceAfterKey<string>(DAYS, "spring", "ArrowRight")).toBe("winter");
  });
});
