import { describe, expect, test } from "bun:test";
import { voltageWordsOf, type VoltageFacts } from "./voltage-words";

const NAMES: Record<string, string> = { IN: "India", US: "the United States", CA: "Canada", DE: "Germany" };
const nameOf = (country: string) => NAMES[country] ?? country;
const FITS = { ok: true, voc_cold: 51, n_min: 14, n_max_mppt: 30 };
const V = (volts: number) => `${volts} V`;

const facts = (changes: Partial<VoltageFacts>): VoltageFacts => ({
  voltage: 1000,
  by: "app",
  country: "IN",
  nameOf,
  ratings: { inverter: 1500, module: 1500 },
  range: FITS,
  ...changes,
});

describe("who set the voltage, beside the heading", () => {
  test("the app, for the user's country", () => {
    expect(voltageWordsOf(facts({})).who).toBe("Set for India");
    expect(voltageWordsOf(facts({ voltage: 600, country: "US" })).who).toBe("Set for the United States");
  });

  test("the app, for another country than the one the user is in now: its default (V2 · 3)", () => {
    expect(voltageWordsOf(facts({ voltage: 600, country: "IN" })).who).toBe("Default");
  });

  test("the user: Yours, with the voltage of the country it took the place of (V2 · 3)", () => {
    expect(voltageWordsOf(facts({ by: "user" })).who).toBe("Yours");
    expect(voltageWordsOf(facts({ by: "user" })).setBy).toEqual({ kind: "yours", byDefault: "1000\u00a0V" });
    expect(voltageWordsOf(facts({})).setBy).toEqual({ kind: "country", country: "India" });
  });
});

describe("the line under the choice, for the app's value", () => {
  test("says where the value comes from", () => {
    expect(voltageWordsOf(facts({})).line).toBe(`${V(1000)}, the usual limit for rooftops in India. Change it if the site needs another.`);
    expect(voltageWordsOf(facts({ voltage: 600, country: "US" })).line).toBe(`${V(600)}, the limit for homes in the United States (NEC 690.7). Change it if the site allows more.`);
    expect(voltageWordsOf(facts({ voltage: 600, country: "CA" })).line).toBe(`${V(600)}, the limit for homes in Canada (CE Code, Section 64). Change it if the site allows more.`);
  });

  test("for a value set in another country, says it of the value", () => {
    expect(voltageWordsOf(facts({ voltage: 600, country: "DE" })).line).toBe(`${V(600)}, the limit for homes in the United States and Canada. Change it if the site allows more.`);
    expect(voltageWordsOf(facts({ voltage: 1000, country: "US" })).line).toBe(`${V(1000)}, the usual limit for rooftops outside the United States and Canada. Change it if the site needs another.`);
  });

  test("is none for the user's own value", () => {
    expect(voltageWordsOf(facts({ by: "user" })).line).toBeNull();
  });
});

describe("equipment rated under the voltage (D88)", () => {
  test("set by the app: a plain line, the value kept", () => {
    const words = voltageWordsOf(facts({ ratings: { inverter: 800, module: 1500 } }));

    expect(words.limit).toBe(`Strings sized to ${V(800)}, this inverter's limit.`);
    expect(words.note).toBeNull();
  });

  test("chosen by the user: the note, and the highest voltage that matches", () => {
    const words = voltageWordsOf(facts({ voltage: 1500, by: "user", ratings: { inverter: 1100, module: 1500 } }));

    expect(words.limit).toBeNull();
    expect(words.note).toEqual({
      title: `Strings sized to ${V(1100)}, this inverter's limit`,
      detail: `Your system voltage is ${V(1500)}, and the bill of materials uses it.`,
      use: 1000,
    });
  });

  test("names the module when it is the lower rating", () => {
    expect(voltageWordsOf(facts({ ratings: { inverter: 1500, module: 800 } })).limit).toBe(`Strings sized to ${V(800)}, this module's limit.`);
  });

  // #179, item 14: a module whose file gives no rating is taken as 1000 V; the words say it was taken, not the module's.
  test("a module rating taken for want of one in the file is said to be taken", () => {
    const taken = { inverter: 1500, module: 1000, moduleTaken: true };
    expect(voltageWordsOf(facts({ voltage: 1500, ratings: taken })).limit).toBe(`Strings sized to ${V(1000)}, the app's value for a module file without a limit.`);
    const note = voltageWordsOf(facts({ voltage: 1500, by: "user", ratings: taken })).note;
    expect(note?.title).toBe(`Strings sized to ${V(1000)}, the app's value for this module`);
    expect(note?.detail).toBe(`The module file gives no limit, so the app takes ${V(1000)}. Your system voltage is ${V(1500)}, and the bill of materials uses it.`);
    expect(voltageWordsOf(facts({ voltage: 600, ratings: taken })).offer?.words).toBe(`The module file gives no limit, so the app takes ${V(1000)}. Raise it only if the site's code allows.`);
  });

  test("offers no button when no voltage is at or under the rating", () => {
    expect(voltageWordsOf(facts({ voltage: 600, by: "user", ratings: { inverter: 550, module: 1500 } })).note?.use).toBeNull();
  });

  test("says nothing when a file gives no rating", () => {
    const words = voltageWordsOf(facts({ ratings: { inverter: 0, module: 0 } }));

    expect(words.limit).toBeNull();
    expect(words.offer).toBeNull();
  });
});

describe("equipment rated over the voltage: the offer up, never taken by the app", () => {
  test("the next voltage the equipment takes", () => {
    expect(voltageWordsOf(facts({})).offer).toEqual({ words: `This inverter takes up to ${V(1500)}. Raise it only if the site's code allows.`, use: 1500 });
    expect(voltageWordsOf(facts({ voltage: 600, country: "US" })).offer?.use).toBe(1000);
  });

  test("where no string length fits, the lowest voltage at which one does", () => {
    // 51 V a module at the coldest, at least 14 in series: 600 V holds 11, 1000 V holds 19.
    const words = voltageWordsOf(facts({ voltage: 600, country: "US", range: { ...FITS, ok: false } }));

    expect(words.offer).toEqual({ words: `No string length fits at ${V(600)}. One fits at ${V(1000)}. Raise it only if the site's code allows.`, use: 1000 });
  });

  test("none where no length fits at any voltage the equipment takes", () => {
    const words = voltageWordsOf(facts({ voltage: 600, ratings: { inverter: 1000, module: 1000 }, range: { ...FITS, ok: false, n_min: 25 } }));

    expect(words.offer).toBeNull();
  });

  test("none when the voltage is the equipment's own", () => {
    expect(voltageWordsOf(facts({ voltage: 1500 })).offer).toBeNull();
  });
});
