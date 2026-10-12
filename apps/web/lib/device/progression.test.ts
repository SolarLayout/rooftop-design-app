import { describe, expect, test } from "bun:test";
import { addSeen, isPanelHiddenOn, MET_KEY, PANEL_KEY, rememberMet, rememberPanelHidden, rememberSeen, SEEN_KEY, seenOf, wordsMetOf } from "./progression";

// What the progression remembers on this device (D95, D96, D99): the steps opened per design, the app's words met, the
// panel hidden. A storage that refuses only means it is said again.

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

describe("the steps opened, per design", () => {
  test("none for a design never opened; each design its own; a step once, in the order of the work", () => {
    const storage = memory();
    expect(seenOf(storage, "d1")).toEqual([]);
    rememberSeen(storage, "d1", addSeen(seenOf(storage, "d1"), "strings"));
    rememberSeen(storage, "d1", addSeen(seenOf(storage, "d1"), "roof"));
    rememberSeen(storage, "d1", addSeen(seenOf(storage, "d1"), "roof"));
    expect(seenOf(storage, "d1")).toEqual(["roof", "strings"]);
    expect(seenOf(storage, "d2")).toEqual([]);
    expect(JSON.parse(storage.items.get(SEEN_KEY) ?? "{}")).toEqual({ d1: ["roof", "strings"] });
  });

  test("what is no step is left out; a storage that refuses remembers nothing and throws nothing", () => {
    expect(seenOf(memory({ [SEEN_KEY]: '{"d1":["roof","sun",3]}' }), "d1")).toEqual(["roof"]);
    expect(seenOf(refusing, "d1")).toEqual([]);
    expect(() => rememberSeen(refusing, "d1", ["roof"])).not.toThrow();
  });
});

describe("the app's words met, on this device", () => {
  test("a word met is remembered; a word of no line is left out", () => {
    const storage = memory();
    rememberMet(storage, new Set(["Strings"]));
    expect([...wordsMetOf(storage)]).toEqual(["Strings"]);
    expect([...wordsMetOf(memory({ [MET_KEY]: '["Strings","Vitals"]' }))]).toEqual(["Strings"]);
    expect(wordsMetOf(refusing).size).toBe(0);
  });
});

describe("the panel hidden, on this device", () => {
  test("shown at first; hidden is remembered; shown again forgets it", () => {
    const storage = memory();
    expect(isPanelHiddenOn(storage)).toBe(false);
    rememberPanelHidden(storage, true);
    expect(isPanelHiddenOn(storage)).toBe(true);
    rememberPanelHidden(storage, false);
    expect(storage.items.has(PANEL_KEY)).toBe(false);
    expect(isPanelHiddenOn(refusing)).toBe(false);
  });
});
