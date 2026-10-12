// How the options are made, behind a link under the options (V2 · 6, D102; the board "The Strings step", audit V2-29): the
// paragraph of rules becomes three numbered lines and a line for the options that miss the target. The numbers are read
// from the engine's own note on the options and from the options; no rule is written a second time. Pure.
import type { DesignOption } from "../api";

export type OptionsRules = {
  /** The numbered lines, in order. */
  lines: string[];
  /** The options that miss the DC/AC target, with their ratio; none where every option is in target. */
  missed: string | null;
};

const TARGET = /Target DC\/AC (\d\.\d\d)–(\d\.\d\d), warning above (\d\.\d\d)\./;
const PER_MPPT = /At most (\d+) strings per MPPT \((\d+) × ([\d.]+) A ≤ ([\d.]+) A\)/;
const NO_LIMIT = /The OND gives no current limit per MPPT:(.+?\.) (Enter the datasheet value of the current per MPPT\.)/;
const LEAST_SHADED = "The least shaded strings are used first.";

const names = (letters: readonly string[]) => (letters.length === 1 ? letters[0]! : `${letters.slice(0, -1).join(", ")} and ${letters.at(-1)}`);

function missedOf(options: readonly Pick<DesignOption, "letter" | "dcac" | "ok" | "note">[]): string | null {
  const missed = options.filter((option) => !option.ok);
  if (missed.length === 0) return null;
  const ratios = new Set(missed.map((option) => option.dcac.toFixed(2)));
  const under = missed.every((option) => option.note.startsWith("below"));
  if (ratios.size === 1 && (under || missed.every((option) => option.note.startsWith("above")))) {
    return `${names(missed.map((option) => option.letter))} ${missed.length === 1 ? "is" : "are"} ${under ? "under" : "over"} the target: ${missed.length === 1 ? "its" : "their"} DC/AC ratio is ${[...ratios][0]}.`;
  }
  return missed.map((option) => `${option.letter} (${option.dcac.toFixed(2)}) is ${option.note.startsWith("below") ? "under the target" : "over it"}`).join("; ") + ".";
}

export function optionsRulesOf(note: string, options: readonly Pick<DesignOption, "letter" | "dcac" | "ok" | "note">[]): OptionsRules {
  const target = TARGET.exec(note);
  const perMppt = PER_MPPT.exec(note);
  const noLimit = NO_LIMIT.exec(note);
  if (!target || (!perMppt && !noLimit)) return { lines: [note.split(" ! ")[0] ?? note], missed: missedOf(options) };
  const [, low, high, warn] = target;
  return {
    lines: [
      `Each option keeps the DC/AC ratio between ${low} and ${high}. Above ${warn} it is marked.`,
      perMppt ? `An MPPT takes at most ${perMppt[1]} strings: ${perMppt[2]} strings of ${perMppt[3]} A stay under ${perMppt[4]} A.` : `The inverter file gives no current limit per MPPT:${noLimit![1]} ${noLimit![2]}`,
      LEAST_SHADED,
    ],
    missed: missedOf(options),
  };
}
