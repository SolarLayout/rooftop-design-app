import { describe, expect, test } from "bun:test";
import type { DesignResult, Verdict } from "../api";
import { headerOf } from "./header";
import { A, B, BEFORE_A_VOLTAGE, D, DEMO, NASA, READOUTS, YOUR_OWN } from "./test-fixtures";

describe("the line of the run (plan/phase-08-plan.md, decision 2)", () => {
  test("the chosen option's stringing, then the weather's hours, source, temperatures and horizon, in the board's words", () => {
    expect(headerOf(DEMO, READOUTS).runLine).toBe("29 modules in series × 22 strings on 1 inverter · 8,760 hours of PVGIS weather, 11.9 to 39.3 °C, horizon up to 2.7°");
  });

  test("two inverters, and a weather without a horizon says so", () => {
    const line = headerOf({ ...DEMO, chosen_option: D.key, weather: NASA } as DesignResult, READOUTS).runLine;

    expect(line).toBe("26 modules in series × 27 strings on 2 inverters · 8,760 hours of NASA POWER weather, 8.9 to 40.3 °C, no horizon");
  });

  test("a CSV is named CSV", () => {
    const line = headerOf({ ...DEMO, weather: { ...NASA, source: "csv", label: "pune.csv" } } as DesignResult, READOUTS).runLine;

    expect(line).toContain("hours of CSV weather");
  });

  test("before options the first part counts the positions that are ready, from the layout's read-outs", () => {
    expect(headerOf(BEFORE_A_VOLTAGE, READOUTS).runLine).toBe("790 positions ready · 8,760 hours of PVGIS weather, 11.9 to 39.3 °C, horizon up to 2.7°");
  });

  test("the read-outs are the newer layout's where there is one, the run's own otherwise", () => {
    expect(headerOf(BEFORE_A_VOLTAGE, { ...READOUTS, positions: 1240 }).runLine.startsWith("1,240 positions ready")).toBe(true);
    expect(headerOf(BEFORE_A_VOLTAGE, null).runLine.startsWith("790 positions ready")).toBe(true);
  });
});

describe("the option switch (decision 4)", () => {
  test("the run's options by their letter; the chosen one with its caption; the mark of the verdict, said to a screen reader", () => {
    const { items, chosen } = headerOf(DEMO, READOUTS);

    expect(chosen).toBe("29x22x1");
    expect(items).toEqual([
      { key: "29x22x1", letter: "A", caption: "Recommended", label: "A · Recommended", name: "A · Recommended, in target", mark: { kind: "fits", label: "In target" }, isChosen: true },
      { key: "26x24x1", letter: "B", caption: "Fills the inverter", label: "B", name: "B, in target", mark: { kind: "fits", label: "In target" }, isChosen: false },
      { key: "28x22x1", letter: "C", caption: "Lower clipping", label: "C", name: "C, in target", mark: { kind: "fits", label: "In target" }, isChosen: false },
      { key: "26x27x2", letter: "D", caption: "Below target, 2 inverters", label: "D", name: "D, below the DC/AC target", mark: { kind: "note", label: "Below the DC/AC target" }, isChosen: false },
      { key: "28x25x2", letter: "E", caption: "Below target, 2 inverters", label: "E", name: "E, below the DC/AC target", mark: { kind: "note", label: "Below the DC/AC target" }, isChosen: false },
    ]);
  });

  test("another option chosen: its caption moves with the choice", () => {
    const { items } = headerOf({ ...DEMO, chosen_option: B.key } as DesignResult, READOUTS);

    expect(items.map((item) => item.label)).toEqual(["A", "B · Fills the inverter", "C", "D", "E"]);
    expect(items.map((item) => item.isChosen)).toEqual([false, true, false, false, false]);
  });

  test("an option the engine gives no caption is its letter alone, chosen or not", () => {
    const { items } = headerOf({ ...DEMO, options: [{ ...A, caption: "" }] } as DesignResult, READOUTS);

    expect(items[0]?.label).toBe("A");
    expect(items[0]?.caption).toBe("");
  });

  test("your own, simulated, is an item, as the engine names it", () => {
    const { items } = headerOf({ ...DEMO, options: [A, YOUR_OWN], chosen_option: "custom" } as DesignResult, READOUTS);

    expect(items.map((item) => item.label)).toEqual(["A", "F · Your own"]);
  });

  test("a refused custom is not an item: it has no energy", () => {
    const refused = { ok: false, title: "26 in series does not fit", detail: "Voc at 11.9 °C is 1,327 V (limit 1000 V)." } as Verdict;
    const { items } = headerOf({ ...DEMO, custom_refused: refused } as DesignResult, READOUTS);

    expect(items.map((item) => item.key)).toEqual(["29x22x1", "26x24x1", "28x22x1", "26x27x2", "28x25x2"]);
  });

  test("before options there are no items and nothing chosen", () => {
    const { items, chosen } = headerOf(BEFORE_A_VOLTAGE, READOUTS);

    expect(items).toEqual([]);
    expect(chosen).toBeNull();
  });
});
