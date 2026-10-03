import { describe, expect, test } from "bun:test";
import type { DesignResult } from "../api";
import { DEMO_RUN_KEY, demoRunOf, demoRunRememberedOf, rememberDemoRunIn } from "./demo-run";

// The demo's run on this device (plan/phase-10-plan.md, step 11, decision 5): the capacity and the energy of the untouched
// demo's run, kept under one key of localStorage once it has run here, so that Home's card shows the engine's numbers and
// never typed ones; until then the card shows the name and the roof alone.

const RUN = {
  chosen_option: "29x22x1",
  options: [
    { key: "29x22x1", dc_kwp: 357.28, energy: { energy_mwh: 617.8405373922709 } },
    { key: "26x27x2", dc_kwp: 393.12, energy: { energy_mwh: 700.9 } },
  ],
  no_options: null,
} as unknown as DesignResult;

function fakeStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

describe("the demo's run", () => {
  test("the key is one, and named for what it holds", () => {
    expect(DEMO_RUN_KEY).toBe("rooftop.demo-run");
  });

  test("of a run with a chosen option: the capacity and the energy of that option", () => {
    expect(demoRunOf(RUN)).toEqual({ dcKwp: 357.28, energyMwh: 617.8405373922709 });
  });

  test("of a run without one there is none: nothing is remembered", () => {
    expect(demoRunOf({ ...RUN, chosen_option: null, options: [] } as unknown as DesignResult)).toBeNull();
    expect(demoRunOf({ ...RUN, chosen_option: "custom" } as unknown as DesignResult)).toBeNull();
  });

  test("remembering writes it under the key, and it is read back", () => {
    const storage = fakeStorage();

    rememberDemoRunIn(storage)({ dcKwp: 357.28, energyMwh: 617.8405373922709 });

    expect(storage.map.has(DEMO_RUN_KEY)).toBe(true);
    expect(demoRunRememberedOf(storage)).toEqual({ dcKwp: 357.28, energyMwh: 617.8405373922709 });
  });

  test("nothing remembered, or something that is not a run, is none", () => {
    expect(demoRunRememberedOf(fakeStorage())).toBeNull();
    expect(demoRunRememberedOf(fakeStorage({ [DEMO_RUN_KEY]: "not json" }))).toBeNull();
    expect(demoRunRememberedOf(fakeStorage({ [DEMO_RUN_KEY]: '{"dcKwp":"357","energyMwh":617.8}' }))).toBeNull();
    expect(demoRunRememberedOf(fakeStorage({ [DEMO_RUN_KEY]: '{"dcKwp":357.28}' }))).toBeNull();
  });

  test("a storage that refuses (a private window) is no fault: nothing is remembered, nothing is thrown", () => {
    const refusing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };

    expect(demoRunRememberedOf(refusing)).toBeNull();
    expect(() => rememberDemoRunIn(refusing)({ dcKwp: 1, energyMwh: 2 })).not.toThrow();
  });
});
