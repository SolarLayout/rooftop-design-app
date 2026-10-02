// The MPPT loading of the chosen option (the board "Inverter and sizing"; plan/phase-07-plan.md, decision 17;
// inventory 2.5): a row for each MPPT that has strings, from the run's mppt_loads: the MPPT and its inverter, the
// strings, Imp and Isc each of its limit, kWp and the mark. A limit not known is "not known" with a note mark, and
// the API's note on the current per MPPT stands under the table. Pure; MpptTable draws what it gives.
import { shown } from "../../components/ui/number-entry";
import type { CurrentPerMppt, DesignOption } from "../api";

/** A current of its limit: the value in mono, and words after it where the limit is not known. */
export type CurrentOfLimit = { value: string; words: string | null };

export type MpptRow = {
  key: string;
  /** "MPPT 1": the name of the row in the table, its inverter under it. */
  mppt: string;
  inverter: string;
  /** "INV-1 · MPPT 1": the title of its card on phone. */
  title: string;
  strings: string;
  imp: CurrentOfLimit;
  isc: CurrentOfLimit;
  kwp: string;
  /** A tick or a note, with its words: never a cross. */
  mark: { kind: "fits" | "note"; label: string };
};

export type MpptTable = {
  /** "of option A", beside the heading. */
  of: string;
  rows: MpptRow[];
  /** "Option A: 22 strings on 6 MPPT, at 1500 V", under the table. */
  caption: string;
  /** The API's note on the current per MPPT where a limit is not known; null where every limit is. */
  note: string | null;
};

type Load = DesignOption["mppt_loads"][number];

const amps = (value: number) => shown(value, 1);

function ofItsLimit(current: number, limit: number | null): CurrentOfLimit {
  return limit === null ? { value: `${amps(current)} A`, words: "of not known" } : { value: `${amps(current)} of ${amps(limit)} A`, words: null };
}

function markOf(load: Load): MpptRow["mark"] {
  if (load.imp_limit_a === null || load.isc_limit_a === null) return { kind: "note", label: "Limit not known" };
  return load.ok ? { kind: "fits", label: "Fits" } : { kind: "note", label: "Over the limit" };
}

function rowOf(load: Load): MpptRow {
  return {
    key: load.label,
    mppt: `MPPT ${load.mppt}`,
    inverter: `INV-${load.inverter}`,
    title: load.label,
    strings: shown(load.strings, 0),
    imp: ofItsLimit(load.imp_a, load.imp_limit_a),
    isc: ofItsLimit(load.isc_a, load.isc_limit_a),
    kwp: shown(load.kwp, 2),
    mark: markOf(load),
  };
}

const count = (number: number, thing: string) => `${shown(number, 0)} ${thing}${number === 1 ? "" : "s"}`;

/**
 * The table of *option* at the system voltage it was sized for, with the run's current per MPPT of the file
 * (`max_current_per_mppt`), whose note says what to do when a limit is not known.
 */
export function mpptTableOf(option: DesignOption, voltage: number, current: CurrentPerMppt): MpptTable {
  const rows = option.mppt_loads.map(rowOf);
  const inverters = option.n_inverters > 1 ? ` of ${count(option.n_inverters, "inverter")}` : "";
  const isLimitUnknown = option.mppt_loads.some((load) => load.imp_limit_a === null || load.isc_limit_a === null);
  return {
    of: `of option ${option.letter}`,
    rows,
    caption: `Option ${option.letter}: ${count(option.n_strings, "string")} on ${shown(rows.length, 0)} MPPT${inverters}, at ${voltage} V`,
    note: isLimitUnknown ? current.note : null,
  };
}
