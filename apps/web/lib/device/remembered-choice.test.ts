import { describe, expect, test } from "bun:test";
import { choiceOf, rememberChoice } from "./remembered-choice";

// A choice of a view the user left on this device (V2 · 8: Performance's tab), by its key: one of the choices given, else
// the first. A storage that refuses only means the first is shown again.

function memory(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => void items.set(key, value), removeItem: (key: string) => void items.delete(key), items };
}

const refusing = {
  getItem: (): string | null => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

const TABS = ["month", "years", "losses", "assumptions"] as const;

describe("a choice remembered on the device", () => {
  test("the first while none was left; the one left after", () => {
    const storage = memory();
    expect(choiceOf(storage, "rooftop.performance-tab", TABS)).toBe("month");
    rememberChoice(storage, "rooftop.performance-tab", "losses");
    expect(choiceOf(storage, "rooftop.performance-tab", TABS)).toBe("losses");
    expect(storage.items.get("rooftop.performance-tab")).toBe('"losses"');
  });

  test("a value that is not one of the choices, or not JSON, is the first", () => {
    expect(choiceOf(memory({ "rooftop.performance-tab": '"summary"' }), "rooftop.performance-tab", TABS)).toBe("month");
    expect(choiceOf(memory({ "rooftop.performance-tab": "losses" }), "rooftop.performance-tab", TABS)).toBe("month");
  });

  test("a storage that refuses: the first, and nothing thrown", () => {
    expect(choiceOf(refusing, "rooftop.performance-tab", TABS)).toBe("month");
    expect(() => rememberChoice(refusing, "rooftop.performance-tab", "years")).not.toThrow();
  });
});
