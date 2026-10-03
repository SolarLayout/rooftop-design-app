import { describe, expect, test } from "bun:test";
import { OPEN_DESIGN_KEY, rememberedOf, rememberIn } from "./remembered";

// The id of the open design across a reload (plan/phase-10-plan.md, decision 2): one key of localStorage, the id alone;
// a design not kept leaves nothing there.

function fakeStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

describe("the remembered design", () => {
  test("the key is one, and named for what it holds", () => {
    expect(OPEN_DESIGN_KEY).toBe("rooftop.open-design");
  });

  test("none remembered: null; an id remembered: the id", () => {
    expect(rememberedOf(fakeStorage())).toBeNull();
    expect(rememberedOf(fakeStorage({ "rooftop.open-design": "a1" }))).toBe("a1");
  });

  test("an empty value is none", () => {
    expect(rememberedOf(fakeStorage({ "rooftop.open-design": "" }))).toBeNull();
  });

  test("remembering writes the id under the key; null removes it", () => {
    const storage = fakeStorage({ other: "stays" });
    const remember = rememberIn(storage);

    remember("a1");
    expect(storage.map.get("rooftop.open-design")).toBe("a1");

    remember("b2");
    expect(storage.map.get("rooftop.open-design")).toBe("b2");

    remember(null);
    expect(storage.map.has("rooftop.open-design")).toBe(false);
    expect(storage.map.get("other")).toBe("stays");
  });

  test("a storage that refuses (a private window) is no fault of the design: the id is not remembered, nothing is thrown", () => {
    const refusing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };

    expect(rememberedOf(refusing)).toBeNull();
    expect(() => rememberIn(refusing)("a1")).not.toThrow();
    expect(() => rememberIn(refusing)(null)).not.toThrow();
  });
});
