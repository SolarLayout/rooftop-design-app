import { describe, expect, test } from "bun:test";
import { stringLegendOf } from "./string-legend";
import type { Wired } from "./string-colours";

// The legend of the strings on the stage (plan/phase-07-plan.md, step 14; the boards "Strings on the roof" and
// "Studio, Strings lens"): by MPPT "MPPT 1" to "MPPT 6", by inverter "INV-1"…, by string the six colours in turn with
// the strings each holds; then "Not used" while positions are not used. The swatch is a series colour by its number.

const string = (label: string, inverter = 1, mppt = 1): Wired => ({ label, modules: [], inverter, mppt });

/** Option A's way: 22 strings on one inverter, its six MPPTs taking 4, 4, 4, 4, 3 and 3. */
const A = Array.from({ length: 22 }, (_, n) => string(`S${n + 1}`, 1, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6][n]));

describe("the legend by MPPT", () => {
  test("names each MPPT that has strings in its colour, then the positions not used", () => {
    const legend = stringLegendOf(A, "mppt", 152);
    expect(legend.entries).toEqual([
      { swatch: 1, words: "MPPT 1" },
      { swatch: 2, words: "MPPT 2" },
      { swatch: 3, words: "MPPT 3" },
      { swatch: 4, words: "MPPT 4" },
      { swatch: 5, words: "MPPT 5" },
      { swatch: 6, words: "MPPT 6" },
      { swatch: "unused", words: "Not used" },
    ]);
    expect(legend.compact).toEqual({ lead: "MPPT", items: [1, 2, 3, 4, 5, 6].map((n) => ({ swatch: n, words: String(n) })) });
    expect(legend.note).toBeNull();
  });

  test("an MPPT of two inverters is named once", () => {
    const legend = stringLegendOf([string("S1", 1, 3), string("S2", 2, 3), string("S3", 2, 1)], "mppt", 0);
    expect(legend.entries).toEqual([
      { swatch: 1, words: "MPPT 1" },
      { swatch: 3, words: "MPPT 3" },
    ]);
  });
});

describe("the legend by inverter", () => {
  test("names each inverter in its colour", () => {
    const legend = stringLegendOf([string("S1", 1), string("S15", 2), string("S16", 2)], "inverter", 88);
    expect(legend.entries).toEqual([
      { swatch: 1, words: "INV-1" },
      { swatch: 2, words: "INV-2" },
      { swatch: "unused", words: "Not used" },
    ]);
    expect(legend.compact.lead).toBe("INV");
    expect(legend.compact.items).toEqual([
      { swatch: 1, words: "1" },
      { swatch: 2, words: "2" },
    ]);
  });
});

describe("the legend by string", () => {
  test("the six colours in turn, each with the strings it marks by their numbers", () => {
    const legend = stringLegendOf(A, "string", 152);
    expect(legend.entries).toEqual([
      { swatch: 1, words: "S1 · S7 · S13 · S19" },
      { swatch: 2, words: "S2 · S8 · S14 · S20" },
      { swatch: 3, words: "S3 · S9 · S15 · S21" },
      { swatch: 4, words: "S4 · S10 · S16 · S22" },
      { swatch: 5, words: "S5 · S11 · S17" },
      { swatch: 6, words: "S6 · S12 · S18" },
      { swatch: "unused", words: "Not used" },
    ]);
    expect(legend.note).toBe("By string: six colours in turn along the rows");
    // Compact, the strings are named as they are: a number alone would not say which.
    expect(legend.compact).toEqual({ lead: null, items: legend.entries.slice(0, 6) });
  });

  test("whatever order the strings come in", () => {
    expect(stringLegendOf([...A].reverse(), "string", 152)).toEqual(stringLegendOf(A, "string", 152));
  });

  test("with fewer than six strings, the colours there are", () => {
    const legend = stringLegendOf([string("S2"), string("S1"), string("S3")], "string", 0);
    expect(legend.entries).toEqual([
      { swatch: 1, words: "S1" },
      { swatch: 2, words: "S2" },
      { swatch: 3, words: "S3" },
    ]);
    expect(legend.note).toBe("By string: three colours in turn along the rows");
  });
});

describe("the words of the legend to a screen reader", () => {
  test("say every colour and what it marks", () => {
    expect(stringLegendOf([string("S1", 1), string("S15", 2)], "inverter", 88).label).toBe("Colours: INV-1, INV-2, Not used");
  });
});
