// The words of the system voltage in the Strings lens (the boards "System voltage · Set by the user's country"; D87,
// D88): who set it, where the app's value comes from, what the equipment's ratings do to the strings, and the voltage
// above that the equipment takes. The app never moves the value; it says and offers. Pure; the lens draws what it gives.
import { defaultVoltageOf } from "../country/country";
import { DEFAULT, wordOf, type SetBy } from "./set-by";
import { VOLTAGES, type Volts } from "./voltages";

/** A number and its unit, kept on one line. */
const v = (volts: number) => `${Math.round(volts)} V`;

export type VoltageFacts = {
  voltage: Volts;
  /** Who set it; none in a file of before, which counts as the user's. */
  by: "app" | "user" | null;
  /** The user's country now (lib/country). */
  country: string;
  /** A country's name as a sentence takes it: "the United States". */
  nameOf: (country: string) => string;
  /** The highest DC voltages of the inverter and of the module, from their files; 0 where a file gives none. None before a run.
   * moduleTaken: the module's file gives no rating and the engine takes 1000 V for it (#179, item 14). */
  ratings: { inverter: number; module: number; moduleTaken?: boolean } | null;
  /** What the run's series range says of a string, for the offer where no length fits. None before a run. */
  range: { ok: boolean; voc_cold: number; n_min: number; n_max_mppt: number } | null;
};

export type VoltageWords = {
  /** Who set it (V2 · 3): the user's country, the app's default, or the user's. */
  setBy: SetBy;
  /** Beside the heading: its word. */
  who: string;
  /** Under the choice: where the app's value comes from. None for the user's. */
  line: string | null;
  /** Under it, plain: the equipment's rating limits the strings under the app's value. */
  limit: string | null;
  /** The user's value is over the equipment's rating: the note with the exclamation mark, and the voltage that matches. */
  note: { title: string; detail: string; use: Volts | null } | null;
  /** A higher voltage the equipment takes, for the user to choose where the site's code allows it. */
  offer: { words: string; use: Volts } | null;
};

type Rating = { volts: number; of: "inverter" | "module"; taken: boolean };

/** The lower of the two ratings a file gives; none when neither does. */
function ratingOf(ratings: VoltageFacts["ratings"]): Rating | null {
  if (!ratings) return null;
  const given: Rating[] = [];
  if (ratings.inverter > 0) given.push({ volts: ratings.inverter, of: "inverter", taken: false });
  if (ratings.module > 0) given.push({ volts: ratings.module, of: "module", taken: ratings.moduleTaken === true });
  return given.sort((a, b) => a.volts - b.volts)[0] ?? null;
}

function lineOf(voltage: Volts, country: string, nameOf: (country: string) => string): string {
  const isTheCountrys = defaultVoltageOf(country) === voltage;
  if (voltage === 600) {
    const where = !isTheCountrys ? "the United States and Canada" : country === "CA" ? "Canada (CE Code, Section 64)" : `${nameOf(country)} (NEC 690.7)`;
    return `${v(600)}, the limit for homes in ${where}. Change it if the site allows more.`;
  }
  const where = isTheCountrys ? `in ${nameOf(country)}` : "outside the United States and Canada";
  return `${v(voltage)}, the usual limit for rooftops ${where}. Change it if the site needs another.`;
}

/** Whether a string length fits at a voltage: the shortest needed is at most the longest the voltage and the MPPT allow. */
function fitsAt(volts: number, rating: Rating, range: NonNullable<VoltageFacts["range"]>): boolean {
  const longest = Math.min(Math.floor(Math.min(volts, rating.volts) / range.voc_cold), range.n_max_mppt);
  return longest >= range.n_min;
}

function offerOf(voltage: Volts, rating: Rating | null, range: VoltageFacts["range"]): VoltageWords["offer"] {
  if (!rating) return null;
  const above = VOLTAGES.filter((volts) => volts > voltage && volts <= rating.volts);
  if (range && !range.ok) {
    const fitting = above.find((volts) => fitsAt(volts, rating, range));
    if (fitting === undefined) return null;
    return { words: `No string length fits under ${v(voltage)}; at ${v(fitting)} one does. Raise it only if the site's code allows.`, use: fitting };
  }
  const next = above[0];
  if (next === undefined) return null;
  const takes = rating.taken ? `${v(rating.volts)} is taken for this module: its file gives no limit.` : `This ${rating.of} takes up to ${v(rating.volts)}.`;
  return { words: `${takes} Raise it only if the site's code allows.`, use: next };
}

export function voltageWordsOf({ voltage, by, country, nameOf, ratings, range }: VoltageFacts): VoltageWords {
  const isTheApps = by === "app";
  const rating = ratingOf(ratings);
  const under = rating !== null && rating.volts < voltage ? rating : null;
  const matching = under ? ([...VOLTAGES].reverse().find((volts) => volts <= under.volts) ?? null) : null;
  const setBy: SetBy = !isTheApps ? { kind: "yours", byDefault: v(defaultVoltageOf(country)) } : defaultVoltageOf(country) === voltage ? { kind: "country", country: nameOf(country) } : DEFAULT;
  return {
    setBy,
    who: wordOf(setBy),
    line: isTheApps ? lineOf(voltage, country, nameOf) : null,
    limit: isTheApps && under ? (under.taken ? `Strings sized to ${v(under.volts)}, taken for this module: its file gives no limit.` : `Strings sized to ${v(under.volts)}, this ${under.of}'s limit.`) : null,
    note:
      !isTheApps && under
        ? {
            title: under.taken ? `Strings sized to ${v(under.volts)}, taken for this module` : `Strings sized to ${v(under.volts)}, this ${under.of}'s limit`,
            detail: `${under.taken ? `Its file gives no limit, so ${v(under.volts)} is taken. ` : ""}Your system is set to ${v(voltage)}. The bill of materials follows the voltage set.`,
            use: matching,
          }
        : null,
    offer: offerOf(voltage, rating, range),
  };
}
