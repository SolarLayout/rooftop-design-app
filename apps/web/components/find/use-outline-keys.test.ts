import { describe, expect, test } from "bun:test";
import { outlineEventOfKey } from "./use-outline-keys";

const key = (key: string, mods: Partial<{ shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }> = {}) => ({
  key,
  shiftKey: false,
  metaKey: false,
  ctrlKey: false,
  ...mods,
});

describe("the keys of the outline", () => {
  test("Enter closes, Escape steps back, Delete and Backspace remove", () => {
    expect(outlineEventOfKey(key("Enter"))).toEqual({ type: "close" });
    expect(outlineEventOfKey(key("Escape"))).toEqual({ type: "steppedBack" });
    expect(outlineEventOfKey(key("Delete"))).toEqual({ type: "removed" });
    expect(outlineEventOfKey(key("Backspace"))).toEqual({ type: "removed" });
  });

  test("the arrows nudge, with Shift a metre", () => {
    expect(outlineEventOfKey(key("ArrowUp"))).toEqual({ type: "nudged", key: "ArrowUp", shift: false });
    expect(outlineEventOfKey(key("ArrowLeft", { shiftKey: true }))).toEqual({ type: "nudged", key: "ArrowLeft", shift: true });
  });

  test("Cmd or Ctrl with Z undoes; with Shift too, redoes", () => {
    expect(outlineEventOfKey(key("z", { metaKey: true }))).toEqual({ type: "undone" });
    expect(outlineEventOfKey(key("z", { ctrlKey: true }))).toEqual({ type: "undone" });
    expect(outlineEventOfKey(key("Z", { metaKey: true, shiftKey: true }))).toEqual({ type: "redone" });
  });

  test("another key is none of the outline's", () => {
    expect(outlineEventOfKey(key("a"))).toBeNull();
    expect(outlineEventOfKey(key("z"))).toBeNull();
  });
});
