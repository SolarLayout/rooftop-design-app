import { describe, expect, test } from "bun:test";
import type { DesignOption, DesignResult } from "../api";
import { foldedWordsOf, optionCardsOf } from "./option-cards";

const option = (change: Partial<DesignOption>) =>
  ({ key: "29x22x1", letter: "A", caption: "Recommended", n_series: 29, n_strings: 22, n_inverters: 1, dc_kwp: 357.28, dcac: 1.3, ok: true, note: "", custom: false, verdict: { ok: true }, energy: { energy_mwh: 617.84 }, ...change }) as DesignOption;

const A = option({});
const D = option({ key: "26x27x2", letter: "D", caption: "Below target, 2 inverters", n_series: 26, n_strings: 27, n_inverters: 2, dc_kwp: 393.12, dcac: 0.714, ok: false, note: "below target", verdict: { ok: false } as never, energy: { energy_mwh: 700.94 } as never });
const run = { options: [A, D], chosen_option: "29x22x1" } as unknown as DesignResult;

describe("the option cards (V2 · 6, D102; the board \"The Strings step\")", () => {
  test("the letter, why it is there, the facts of the stringing, the energy and the mark of the verdict", () => {
    expect(optionCardsOf(run)).toEqual([
      { key: "29x22x1", letter: "A", caption: "Recommended", facts: "29 × 22 · 357.28 kWp", energy: "617.8", mark: { kind: "fits", label: "In target" }, isChosen: true, isCustom: false, miss: null },
      { key: "26x27x2", letter: "D", caption: "Below target", facts: "26 × 27 · 393.12 kWp · 2 inverters", energy: "700.9", mark: { kind: "note", label: "Below the DC/AC target" }, isChosen: false, isCustom: false, miss: "below" },
    ]);
  });

  test("the chosen card is the run's chosen option", () => {
    expect(optionCardsOf({ ...run, chosen_option: "26x27x2" }).map((card) => card.isChosen)).toEqual([false, true]);
  });

  test("an option without a caption of the engine is named by its letter alone", () => {
    expect(optionCardsOf({ ...run, options: [option({ caption: "" })] })[0]?.caption).toBe("Option A");
  });

  test("the engine's captions in the vocabulary: Less clipping, and a miss of the target without its inverters", () => {
    const captions = optionCardsOf({ ...run, options: [option({ caption: "Lower clipping" }), option({ caption: "Fills the inverters" }), option({ caption: "Above target, 3 inverters", ok: false })] }).map((card) => card.caption);

    expect(captions).toEqual(["Less clipping", "Fills the inverters", "Above target"]);
  });

  test("the inverters are said when there is more than one, by count", () => {
    expect(optionCardsOf({ ...run, options: [option({ n_inverters: 1 }), option({ n_inverters: 3 })] }).map((card) => card.facts)).toEqual(["29 × 22 · 357.28 kWp", "29 × 22 · 357.28 kWp · 3 inverters"]);
  });

  test("a verdict that does not fit is a note, whatever its DC/AC", () => {
    const card = optionCardsOf({ ...run, options: [option({ verdict: { ok: false, title: "29 in series fits: Vmp 1,199 V at STC", detail: "… over the limit of 65.0 A." } })] })[0];
    // The title says the series fits: the mark says what does not, where the table shows it (decision 18).
    expect(card?.mark).toEqual({ kind: "note", label: "Over the current of an MPPT, or its limit not known: see the MPPT loading" });
  });

  test("no run, no cards", () => {
    expect(optionCardsOf(null)).toEqual([]);
  });
});

describe("the options below the DC/AC target fold under one line", () => {
  const cards = optionCardsOf(run);

  test("the line says how many and why", () => {
    expect(foldedWordsOf(cards.filter((card) => card.miss !== null))).toBe("1 more, below the DC/AC target");
    expect(foldedWordsOf([cards[1]!, cards[1]!])).toBe("2 more, below the DC/AC target");
  });

  test("above the target, or both ways, the line says so", () => {
    const above = optionCardsOf({ ...run, options: [option({ ok: false, note: "above target" })] });

    expect(foldedWordsOf(above)).toBe("1 more, above the DC/AC target");
    expect(foldedWordsOf([...above, cards[1]!])).toBe("2 more, outside the DC/AC target");
  });

  test("none, no line", () => {
    expect(foldedWordsOf([])).toBeNull();
  });
});
