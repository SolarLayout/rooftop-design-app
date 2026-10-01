import { describe, expect, test } from "bun:test";
import { historyOfKey } from "./use-history-keys";

// The keys of the Studio's history (plan/phase-05-plan.md, step 18, decision 11): Cmd or Ctrl with Z undoes the
// last committed edit, with Shift redoes it; Ctrl with Y redoes too, as on Windows.

const key = (key: string, mods: Partial<{ shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({
  key,
  shiftKey: false,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
});

describe("the keys of the history", () => {
  test("Cmd or Ctrl with Z undoes; with Shift redoes", () => {
    expect(historyOfKey(key("z", { metaKey: true }))).toBe("undo");
    expect(historyOfKey(key("z", { ctrlKey: true }))).toBe("undo");
    expect(historyOfKey(key("Z", { metaKey: true, shiftKey: true }))).toBe("redo");
  });

  test("Ctrl with Y redoes", () => {
    expect(historyOfKey(key("y", { ctrlKey: true }))).toBe("redo");
  });

  test("a key without Cmd or Ctrl, or with Alt, is none of the history's", () => {
    expect(historyOfKey(key("z"))).toBeNull();
    expect(historyOfKey(key("z", { metaKey: true, altKey: true }))).toBeNull();
    expect(historyOfKey(key("a", { metaKey: true }))).toBeNull();
  });
});
