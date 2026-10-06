import { describe, expect, test } from "bun:test";
import type { ChoiceGone } from "../flow/choice-gone";
import { createChoicesGone } from "./choices-gone";

const GONE = { dropped: { series: 18, strings: 84, inverters: 7 }, shown: { key: "23x67x7" } } as unknown as ChoiceGone;
const LATER = { dropped: null, shown: { key: "24x64x7" } } as unknown as ChoiceGone;

describe("the choices taken away, waiting to be told", () => {
  test("a choice heard waits until it is taken, and is taken once", () => {
    const store = createChoicesGone();
    store.getState().heard(GONE);

    expect(store.getState().take()).toBe(GONE);
    expect(store.getState().take()).toBeNull();
  });

  test("of two heard before either is told, the later is told: it is the design as it is", () => {
    const store = createChoicesGone();
    store.getState().heard(GONE);
    store.getState().heard(LATER);

    expect(store.getState().take()).toBe(LATER);
  });

  test("nothing heard, nothing to tell", () => {
    expect(createChoicesGone().getState().take()).toBeNull();
  });
});
