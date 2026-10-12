import { describe, expect, test } from "bun:test";
import { rememberTipsGone, TIPS_KEY, tipsGoneOf } from "./tips-seen";

// The tips gone for good on this device (D79): one key of localStorage, the ids alone. A storage that refuses
// only means the tips show again.

function memory(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
    items,
  };
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

describe("the tips gone", () => {
  test("none on a device that has seen none", () => {
    expect([...tipsGoneOf(memory())]).toEqual([]);
  });

  test("remembered and read back", () => {
    const storage = memory();

    rememberTipsGone(storage, new Set(["roof"]));

    expect(storage.items.get(TIPS_KEY)).toBe('["roof"]');
    expect([...tipsGoneOf(storage)]).toEqual(["roof"]);
  });

  test("none remembered clears the key: the tips show again", () => {
    const storage = memory({ [TIPS_KEY]: '["roof","obstacle"]' });

    rememberTipsGone(storage, new Set());

    expect(storage.items.has(TIPS_KEY)).toBe(false);
  });

  test("what is not a tip, or not a list, is ignored", () => {
    expect([...tipsGoneOf(memory({ [TIPS_KEY]: '["roof","sun",3]' }))]).toEqual(["roof"]);
    // The obstacles' tip of before (D79) is gone with V2 · 4: its id is left out.
    expect([...tipsGoneOf(memory({ [TIPS_KEY]: '["obstacle"]' }))]).toEqual([]);
    expect([...tipsGoneOf(memory({ [TIPS_KEY]: "{oops" }))]).toEqual([]);
    expect([...tipsGoneOf(memory({ [TIPS_KEY]: '{"roof":true}' }))]).toEqual([]);
  });

  test("a storage that refuses: nothing is gone, and nothing is thrown", () => {
    expect([...tipsGoneOf(refusing)]).toEqual([]);
    expect(() => rememberTipsGone(refusing, new Set(["roof"]))).not.toThrow();
  });
});
