// The single-line diagram of the chosen option (plan/phase-09-plan.md, step 13, decision 6): what the engine draws
// (rooftop_core/plots.py, draw_sld), in its words, from the option's system, its MPPT loads and the equipment. A box per
// inverter with its label and its words; per MPPT a block "4 × 29 mod" and a line "MPPT 1 · DC", or "MPPT 6 · not used";
// the AC side: "AC", the ACDB, the meter, the grid. The blocks take the series colour of their MPPT as the Strings lens
// colours the strings (lib/stores/string-colours.ts, categoryOf by "mppt": the MPPT's number within its inverter, the
// seventh the first again). Pure; sld-layout.ts places it, SingleLineDiagram draws it.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, Equipment, Inverter, Module, PVString } from "../api";

/** What the diagram reads of the run's equipment: the module's power and the inverter's power and MPPT count. */
export type SldEquipment = { module: Pick<Module, "pnom_w">; inverter: Pick<Inverter, "pnom_kw" | "n_mppt"> };

/** The words on a series block: dark is accent-ink, light is white, whichever contrasts more with the colour. */
export type Ink = "dark" | "light";

export type SldMppt = {
  /** From 1, within its inverter. */
  number: number;
  /** The labels of its strings, in the engine's order; none when it is not used. */
  strings: string[];
  /** The block's words, "4 × 29 mod"; null when the MPPT has no strings and no block is drawn. */
  block: string | null;
  /** Over the line to the inverter, "MPPT 1 · DC"; without strings "MPPT 6 · not used" where the line would be. */
  line: string;
  /** The name of the block for the keyboard and a screen reader: "MPPT 2, 4 strings". */
  name: string;
  /** Its load from mppt_loads: "Imp 54.3 of 65.0 A", or "Imp 54.3 A · limit not known"; null when it is not used. */
  load: string | null;
  /** The tooltip of the block: its strings, then its load; null when it is not used. */
  tooltip: { value: string; label: string } | null;
  /** The series colour of the block, from 1 to 6. */
  series: number;
  ink: Ink;
  /** One line of the list for screen readers. */
  said: string;
};

export type SldInverter = {
  /** "INV-1" */
  label: string;
  /** "275 kW · 6 MPPT" */
  words: string;
  mppts: SldMppt[];
};

export type Sld = {
  /** "Single-line diagram · 22 strings of 29 × 560 Wp" */
  title: string;
  inverters: SldInverter[];
  ac: string;
  acdb: string;
  meter: { value: string; label: string };
  grid: string;
};

const SERIES_COLOURS = 6;
/**
 * The series whose colour is read better by white than by accent-ink: series 6, the dark green (contrast 4.95 against
 * 3.75); on the five others accent-ink contrasts more (the board "Handover, previews", ink_on). Held here since the
 * tokens' values are in the stylesheet alone.
 */
const LIGHT_INK_SERIES = new Set([6]);

const NOT_USED = "not used";
const AC = "AC";
const ACDB = "ACDB";
const METER = { value: "kWh", label: "Net meter" };
const GRID = "Grid / LT panel";

/** A number as Python's `:g` prints it: without trailing zeros, so 560.0 is 560 and 27.5 stays. */
export const general = (value: number): string => String(Number(value.toPrecision(6)));

const amps = (value: number) => shown(value, 1);

/** The series of an MPPT counted from 1, the seventh the first again: the Strings lens's rule (string-colours.ts, seriesOf). */
export const seriesOfMppt = (mppt: number): number => ((mppt - 1) % SERIES_COLOURS) + 1;

function loadWordsOf(load: DesignOption["mppt_loads"][number]): string {
  return load.imp_limit_a === null ? `Imp ${amps(load.imp_a)} A · limit not known` : `Imp ${amps(load.imp_a)} of ${amps(load.imp_limit_a)} A`;
}

function mpptOf(option: DesignOption, inverter: number, number: number): SldMppt {
  const strings = option.system.strings.filter((string: PVString) => string.inverter === inverter && string.mppt === number).map((string) => string.label);
  const series = seriesOfMppt(number);
  const ink: Ink = LIGHT_INK_SERIES.has(series) ? "light" : "dark";
  if (strings.length === 0) {
    const line = `MPPT ${number} · ${NOT_USED}`;
    return { number, strings, block: null, line, name: `MPPT ${number}, ${NOT_USED}`, load: null, tooltip: null, series, ink, said: line };
  }
  const found = option.mppt_loads.find((load) => load.inverter === inverter && load.mppt === number);
  const load = found ? loadWordsOf(found) : null;
  const name = `MPPT ${number}, ${strings.length} ${strings.length === 1 ? "string" : "strings"}`;
  const labels = strings.join(" · ");
  return {
    number,
    strings,
    block: `${strings.length} × ${option.system.n_series} mod`,
    line: `MPPT ${number} · DC`,
    name,
    load,
    tooltip: { value: labels, label: load ?? "" },
    series,
    ink,
    said: `${name}: ${labels}${load ? ` · ${load}` : ""}`,
  };
}

/** The diagram of *option* with the equipment of the run, in the engine's words. */
export function sldOf(option: DesignOption, equipment: SldEquipment | Equipment): Sld {
  const { system } = option;
  const nMppt = equipment.inverter.n_mppt;
  const words = `${general(equipment.inverter.pnom_kw)} kW · ${nMppt} MPPT`;
  const inverters = Array.from({ length: system.n_inverters }, (_, index): SldInverter => {
    const inverter = index + 1;
    return { label: `INV-${inverter}`, words, mppts: Array.from({ length: nMppt }, (_, j) => mpptOf(option, inverter, j + 1)) };
  });
  return {
    title: `Single-line diagram · ${system.n_strings} strings of ${system.n_series} × ${general(equipment.module.pnom_w)} Wp`,
    inverters,
    ac: AC,
    acdb: ACDB,
    meter: METER,
    grid: GRID,
  };
}
