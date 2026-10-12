import { describe, expect, test } from "bun:test";
import { isPanelKey } from "./panel-key";

// ⌘ \ (Ctrl \ off a Mac) hides and shows the work column (D99). Nothing else does, and not while typing.

const key = (over: Partial<Parameters<typeof isPanelKey>[0]>) => ({ key: "\\", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, isTyping: false, ...over });

describe("the panel's key", () => {
  test("⌘ \\ and Ctrl \\", () => {
    expect(isPanelKey(key({ metaKey: true }))).toBe(true);
    expect(isPanelKey(key({ ctrlKey: true }))).toBe(true);
  });

  test("not without the modifier, not with another, not another key, not while typing", () => {
    expect(isPanelKey(key({}))).toBe(false);
    expect(isPanelKey(key({ metaKey: true, shiftKey: true }))).toBe(false);
    expect(isPanelKey(key({ metaKey: true, altKey: true }))).toBe(false);
    expect(isPanelKey(key({ metaKey: true, key: "/" }))).toBe(false);
    expect(isPanelKey(key({ metaKey: true, isTyping: true }))).toBe(false);
  });
});
