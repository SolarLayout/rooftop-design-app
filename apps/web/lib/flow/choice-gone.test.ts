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
  test("that the stringing no longer fits and which option is used, in one line", () => {
    expect(choiceGoneWords({ dropped: { series: 18, strings: 84, inverters: 7 }, shown: A })).toBe("Your stringing no longer fits. Option A is used.");
  });

  test("the same without the numbers of the choice", () => {
    expect(choiceGoneWords({ dropped: null, shown: D })).toBe("Your stringing no longer fits. Option D is used.");
  });
});
