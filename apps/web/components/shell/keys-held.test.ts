import { describe, expect, test } from "bun:test";
import { isKeyHeld, type KeyTarget } from "./keys-held";

// Where a key belongs to what has the focus, not to the page behind it (D80): a field, and an open dialog such as the
// help sheet. Without a DOM, a target is what it says it lies in.

const inside = (...places: string[]): KeyTarget => ({
  closest: (selectors) => (selectors.split(",").some((selector) => places.includes(selector.trim())) ? {} : null),
});

describe("a key held where it is pressed", () => {
  test("in an open dialog: the help sheet's Escape closes it, and its undo or arrows never reach the design", () => {
    expect(isKeyHeld(inside("dialog[open]"))).toBe(true);
  });

  test("in a field: its keys edit what is typed", () => {
    expect(isKeyHeld(inside("input"))).toBe(true);
    expect(isKeyHeld(inside("textarea"))).toBe(true);
    expect(isKeyHeld(inside("select"))).toBe(true);
  });

  test("anywhere else, or on the page itself, the page's", () => {
    expect(isKeyHeld(inside("button"))).toBe(false);
    expect(isKeyHeld(null)).toBe(false);
  });

  test("with more places that take their keys, those too", () => {
    expect(isKeyHeld(inside('[role="slider"]'), '[role="slider"]')).toBe(true);
    expect(isKeyHeld(inside("dialog[open]"), '[role="slider"]')).toBe(true);
  });
});
