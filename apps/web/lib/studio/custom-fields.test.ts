import { describe, expect, test } from "bun:test";
import type { DesignResult, Project } from "../api";
import { customBoundsOf, customOf, customVerdictOf, refusedCardOf, withCustom, withoutCustom } from "./custom-fields";

const RUN = {
  series_range: { n_min: 14, n_max: 29 },
  strings_by_series: [
    { n_series: 26, strings: 27 },
    { n_series: 29, strings: 23 },
  ],
  options: [{ key: "29x22x1", letter: "A", n_series: 29, n_strings: 22, n_inverters: 1 }],
  chosen_option: "29x22x1",
  custom_refused: null,
} as unknown as DesignResult;

const DOCUMENT = { chosen_option: "29x22x1", custom: null } as unknown as Project;

describe("your own option (the board \"Options and your own\"; plan/phase-07-plan.md, decisions 8 and 9)", () => {
  test("Add your own begins with the chosen option's numbers", () => {
    expect(customOf(DOCUMENT, RUN)).toEqual([29, 22, 1]);
  });

  test("with too few positions for an option, Add your own begins with the string the API says fits (#171)", () => {
    const tooFew = { ...RUN, options: [], chosen_option: null, series_range: { n_min: 14, n_max: 29 }, no_options: { code: "too_few_positions", title: "", message: "", fits: 15 } } as unknown as DesignResult;
    expect(customOf(DOCUMENT, tooFew)).toEqual([15, 1, 1]);
  });

  test("Change begins with the document's own", () => {
    expect(customOf({ ...DOCUMENT, custom: [26, 24, 1] } as Project, RUN)).toEqual([26, 24, 1]);
  });

  test("the series is bounded by the range, the strings by what the roof holds of that length, the inverters by the strings", () => {
    expect(customBoundsOf(RUN, [29, 22, 1])).toEqual({
      series: { range: { min: 14, max: 29, decimals: 0 }, hint: "14 to 29 fit" },
      strings: { range: { min: 1, max: 23, decimals: 0 }, hint: "Strings of 29: 1 to 23 fit" },
      inverters: { range: { min: 1, max: 22, decimals: 0 }, hint: "1 to 22" },
    });
    expect(customBoundsOf(RUN, [26, 24, 2]).strings).toEqual({ range: { min: 2, max: 27, decimals: 0 }, hint: "Strings of 26: 2 to 27 fit" });
  });

  test("a length the roof holds no string of has no strings to choose", () => {
    expect(customBoundsOf(RUN, [20, 1, 1]).strings).toEqual({ range: { min: 1, max: 1, decimals: 0 }, hint: "No string of 20 fits on the roof" });
  });

  test("added, it is the document's and chosen; changed, it stays chosen", () => {
    expect(withCustom(DOCUMENT, [26, 24, 1])).toMatchObject({ custom: [26, 24, 1], chosen_option: "custom" });
    expect(withCustom({ ...DOCUMENT, custom: [26, 24, 1], chosen_option: "custom" } as Project, [27, 23, 1])).toMatchObject({ custom: [27, 23, 1], chosen_option: "custom" });
  });

  test("removed, it is gone; when it was chosen, the run's first is chosen again", () => {
    expect(withoutCustom({ ...DOCUMENT, custom: [26, 24, 1], chosen_option: "custom" } as Project)).toMatchObject({ custom: null, chosen_option: "" });
    expect(withoutCustom({ ...DOCUMENT, custom: [26, 24, 1], chosen_option: "29x22x1" } as Project)).toMatchObject({ custom: null, chosen_option: "29x22x1" });
  });

  test("refused, its card says the engine's words, with the letter after the run's options and no energy", () => {
    const refused = { ...RUN, custom_refused: { ok: false, title: "29 in series does not fit at 1000 V", detail: "At most 19 fit: …" } } as unknown as DesignResult;
    expect(refusedCardOf({ ...DOCUMENT, custom: [29, 22, 1] } as Project, refused)).toEqual({
      letter: "B",
      numbers: "29 × 22 · 1 inverter",
      title: "29 in series does not fit at 1000 V",
      detail: "At most 19 fit: …",
    });
    expect(refusedCardOf({ ...DOCUMENT, custom: [29, 22, 1] } as Project, RUN)).toBeNull();
  });
});

describe("the verdict of your own option before it is added (V2 · 6)", () => {
  const equipped = { ...RUN, equipment: { module: { pnom_w: 560 }, inverter: { pnom_kw: 275 } }, options_note: "Target DC/AC 1.10–1.30, warning above 1.40. At most 4 strings per MPPT (4 × 13.58 A ≤ 65.0 A), so one inverter takes 24 strings." } as unknown as DesignResult;

  test("in target: Fits, the power and the ratio of the numbers as they stand", () => {
    expect(customVerdictOf(equipped, [26, 24, 1])).toEqual({ kind: "fits", words: "Fits · 349.44 kWp · DC/AC ratio 1.27" });
  });

  test("outside the target: a note that says so, with the same figures", () => {
    expect(customVerdictOf(equipped, [26, 27, 2])).toEqual({ kind: "note", words: "Under the DC/AC target · 393.12 kWp · DC/AC ratio 0.71" });
    expect(customVerdictOf(equipped, [29, 23, 1])).toEqual({ kind: "note", words: "Over the DC/AC target · 373.52 kWp · DC/AC ratio 1.36" });
  });

  test("without the target in the engine's note, the figures alone", () => {
    expect(customVerdictOf({ ...equipped, options_note: "" } as DesignResult, [26, 24, 1])).toEqual({ kind: "fits", words: "349.44 kWp · DC/AC ratio 1.27" });
  });
});
