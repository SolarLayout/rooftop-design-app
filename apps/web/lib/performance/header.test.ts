import { describe, expect, test } from "bun:test";
import type { DesignResult, Verdict } from "../api";
import { headerOf, optionWordsOf } from "./header";
import { A, B, BEFORE_A_VOLTAGE, DEMO, YOUR_OWN } from "./test-fixtures";

describe("the notes on the weather (step 19)", () => {
  test("are the run's, in the engine's words; none for a weather without any", () => {
    const erbs = "pune-ghi.csv has no beam and diffuse irradiance. They were worked out from the global irradiance (Erbs model), which is less exact than measured values.";

    expect(headerOf(DEMO).notes).toEqual([]);
    expect(headerOf({ ...DEMO, weather_notes: [erbs] } as DesignResult).notes).toEqual([erbs]);
  });
});

describe("the option switch (decision 4)", () => {
  test("the run's options by their letter; the chosen one with its caption; the mark of the verdict, said to a screen reader", () => {
    const { items, chosen } = headerOf(DEMO);

    expect(chosen).toBe("29x22x1");
    expect(items).toEqual([
      { key: "29x22x1", letter: "A", caption: "Recommended", label: "A · Recommended", name: "A · Recommended, in target", mark: { kind: "fits", label: "In target" }, isChosen: true },
      { key: "26x24x1", letter: "B", caption: "Fills the inverter", label: "B", name: "B, in target", mark: { kind: "fits", label: "In target" }, isChosen: false },
      { key: "28x22x1", letter: "C", caption: "Less clipping", label: "C", name: "C, in target", mark: { kind: "fits", label: "In target" }, isChosen: false },
      { key: "26x27x2", letter: "D", caption: "Below target, 2 inverters", label: "D", name: "D, below the DC/AC target", mark: { kind: "note", label: "Below the DC/AC target" }, isChosen: false },
      { key: "28x25x2", letter: "E", caption: "Below target, 2 inverters", label: "E", name: "E, below the DC/AC target", mark: { kind: "note", label: "Below the DC/AC target" }, isChosen: false },
    ]);
  });

  test("another option chosen: its caption moves with the choice", () => {
    const { items } = headerOf({ ...DEMO, chosen_option: B.key } as DesignResult);

    expect(items.map((item) => item.label)).toEqual(["A", "B · Fills the inverter", "C", "D", "E"]);
    expect(items.map((item) => item.isChosen)).toEqual([false, true, false, false, false]);
  });

  test("an option the engine gives no caption is its letter alone, chosen or not", () => {
    const { items } = headerOf({ ...DEMO, options: [{ ...A, caption: "" }] } as DesignResult);

    expect(items[0]?.label).toBe("A");
    expect(items[0]?.caption).toBe("");
  });

  test("your own, simulated, is an item, as the app names it", () => {
    const { items } = headerOf({ ...DEMO, options: [A, YOUR_OWN], chosen_option: "custom" } as DesignResult);

    expect(items.map((item) => item.label)).toEqual(["A", "F · Your own option"]);
  });

  test("a refused custom is not an item: it has no energy", () => {
    const refused = { ok: false, title: "26 in series does not fit", detail: "Voc at 11.9 °C is 1,327 V (limit 1000 V)." } as Verdict;
    const { items } = headerOf({ ...DEMO, custom_refused: refused } as DesignResult);

    expect(items.map((item) => item.key)).toEqual(["29x22x1", "26x24x1", "28x22x1", "26x27x2", "28x25x2"]);
  });

  test("the select of Option (V2 · 8): each option by its letter and caption; the chosen one by its letter alone on phone", () => {
    const { items } = headerOf(DEMO);

    expect(items.map((item) => optionWordsOf(item, false))).toEqual(["A · Recommended", "B · Fills the inverter", "C · Less clipping", "D · Below target, 2 inverters", "E · Below target, 2 inverters"]);
    expect(optionWordsOf(items[0]!, true)).toBe("A");
    expect(optionWordsOf({ ...items[0]!, caption: "" }, false)).toBe("A");
  });

  test("before options there are no items and nothing chosen", () => {
    const { items, chosen } = headerOf(BEFORE_A_VOLTAGE);

    expect(items).toEqual([]);
    expect(chosen).toBeNull();
  });
});
