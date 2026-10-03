import { describe, expect, test } from "bun:test";
import { factsWordsOf, waitingWordsOf } from "./words";

// The words at the bottom left of Present (the board "Present"; plan/phase-10-plan.md, decision 9): the design's name
// and its facts, as the card of Home says them; while the tour cannot run, why, in the app's or the API's own words.

describe("the facts", () => {
  test("the name, the capacity and the energy of the year, as the board has them", () => {
    expect(factsWordsOf({ name: "Pune demo roof", dcKwp: 357.28, energyMwh: 617.8405373922709 })).toBe("Pune demo roof · 357.28 kWp · 617.8 MWh a year");
  });

  test("before a run with an option, the name alone", () => {
    expect(factsWordsOf({ name: "Block B", dcKwp: null, energyMwh: null })).toBe("Block B");
  });
});

describe("while the tour waits", () => {
  test("a run on its way says so in the shell's words", () => {
    expect(waitingWordsOf({ isUpdating: true, noOptions: null })).toBe("Updating energy");
  });

  test("a run without options says the API's title, word for word", () => {
    const noOptions = { code: "system_voltage_missing", title: "Choose a system voltage to size the strings", message: "The strings cannot be sized without it." } as const;
    expect(waitingWordsOf({ isUpdating: false, noOptions })).toBe("Choose a system voltage to size the strings");
  });

  test("otherwise nothing is said", () => {
    expect(waitingWordsOf({ isUpdating: false, noOptions: null })).toBeNull();
  });
});
