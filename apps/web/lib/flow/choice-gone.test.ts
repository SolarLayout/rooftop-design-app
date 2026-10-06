import { describe, expect, test } from "bun:test";
import type { DesignResult, Project } from "../api";
import { A, D, DEMO } from "../handover/test-fixtures";
import { choiceGoneOf, choiceGoneWords, withTheChoiceShown } from "./choice-gone";

// A run whose options no longer hold the document's choice (the owner's IKEA design: 18x84x7 chosen, then another module
// and inverter). The engine shows its first option; the document is brought to it, and the user is told in plain words.
const RUN = { ...DEMO, chosen_option: A.key } as unknown as DesignResult;
const document = (chosen: string, custom: [number, number, number] | null = null) => ({ chosen_option: chosen, custom }) as unknown as Project;

describe("a choice an edit took away", () => {
  test("is the document's choice when the run's options do not hold it; the option shown takes its place", () => {
    expect(choiceGoneOf(document("18x84x7"), RUN)).toEqual({ dropped: { series: 18, strings: 84, inverters: 7 }, shown: A });
  });

  test("a choice the run holds is not gone, whichever it is", () => {
    expect(choiceGoneOf(document(A.key), RUN)).toBeNull();
    expect(choiceGoneOf(document(D.key), RUN)).toBeNull();
  });

  test("no choice is none gone: the run's first is shown until the user chooses", () => {
    expect(choiceGoneOf(document(""), RUN)).toBeNull();
  });

  test("a run without options (no voltage, nothing fits) leaves the choice alone: there is nothing to put in its place", () => {
    expect(choiceGoneOf(document("18x84x7"), { ...RUN, options: [], chosen_option: null } as unknown as DesignResult)).toBeNull();
  });

  test("the option shown is the run's own choice, else its first", () => {
    expect(choiceGoneOf(document("18x84x7"), { ...RUN, chosen_option: D.key } as unknown as DesignResult)?.shown).toEqual(D);
    expect(choiceGoneOf(document("18x84x7"), { ...RUN, chosen_option: null } as unknown as DesignResult)?.shown).toEqual(A);
  });

  test("your own option that the run no longer holds is gone as well, with its numbers", () => {
    expect(choiceGoneOf(document("custom", [26, 30, 2]), RUN)).toEqual({ dropped: { series: 26, strings: 30, inverters: 2 }, shown: A });
  });

  test("a key that says no numbers is gone without them", () => {
    expect(choiceGoneOf(document("old-option"), RUN)).toEqual({ dropped: null, shown: A });
  });

  test("the document takes the option shown, and nothing else of it changes", () => {
    const before = { name: "IKEA", chosen_option: "18x84x7", custom: null } as unknown as Project;
    expect(withTheChoiceShown({ dropped: null, shown: A })(before)).toEqual({ ...before, chosen_option: A.key });
  });
});

describe("what the user is told", () => {
  test("the stringing chosen, that it no longer fits, and what is used instead, in plain words", () => {
    expect(choiceGoneWords({ dropped: { series: 18, strings: 84, inverters: 7 }, shown: { ...A, n_series: 23, n_strings: 67, n_inverters: 7 } })).toBe(
      "The stringing you chose, 18 in series × 84 strings on 7 inverters, no longer fits this design. " +
        "Option A, Recommended, is used instead: 23 in series × 67 strings on 7 inverters.",
    );
  });

  test("one string, one inverter, said so", () => {
    expect(choiceGoneWords({ dropped: { series: 20, strings: 1, inverters: 1 }, shown: A })).toBe(
      "The stringing you chose, 20 in series × 1 string on 1 inverter, no longer fits this design. " +
        "Option A, Recommended, is used instead: 29 in series × 22 strings on 1 inverter.",
    );
  });

  test("an option whose caption is only its name is named once", () => {
    expect(choiceGoneWords({ dropped: null, shown: { ...D, letter: "B", caption: "Option B" } })).toBe(
      "The stringing you chose no longer fits this design. Option B is used instead: 26 in series × 27 strings on 2 inverters.",
    );
  });

  test("without the numbers of the choice, still what is used instead", () => {
    expect(choiceGoneWords({ dropped: null, shown: D })).toBe(
      "The stringing you chose no longer fits this design. Option D, Below target, 2 inverters, is used instead: 26 in series × 27 strings on 2 inverters.",
    );
  });
});
