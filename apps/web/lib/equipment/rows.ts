// The words of a row of the equipment picker (docs/design/components.md, "Choose a module or an inverter"): the model,
// the maker as people know it (with the file's data source when one model comes in two files), and the numbers of the
// columns; on phone the numbers on one line. Pure.
import { shown } from "../../components/ui/number-entry";
import type { InverterEntry, ModuleEntry } from "./catalog";
import { makerOf } from "./makers";

export type ModuleRow = {
  model: string;
  second: string;
  cells: { wp: string; efficiency: string; size: string; bifacial: string };
  phone: string;
  preliminary: false;
};

export type InverterRow = {
  model: string;
  second: string;
  cells: { kw: string; mppt: string; window: string; vdc: string };
  phone: string;
  preliminary: boolean;
};

/** A power in kW as the picker shows it: whole kilowatts whole, the small ones with their decimals. */
export function kwShown(kw: number): string {
  return Number.isInteger(kw) ? shown(kw, 0) : String(kw);
}

export function moduleRowOf(entry: ModuleEntry, twins: ReadonlySet<string>): ModuleRow {
  const maker = makerOf(entry.maker);
  const cells = {
    wp: shown(entry.wp, 0),
    efficiency: shown(entry.efficiency_pct, 1),
    size: `${shown(entry.length_m, 2)} × ${shown(entry.width_m, 2)}`,
    bifacial: entry.bifaciality === null ? "–" : shown(entry.bifaciality, 2),
  };
  return {
    model: entry.model,
    second: twins.has(entry.model) && entry.data_source ? `${maker} · ${entry.data_source}` : maker,
    cells,
    phone: `${cells.wp} Wp · ${cells.efficiency} % · ${cells.size} m`,
    preliminary: false,
  };
}

export function inverterRowOf(entry: InverterEntry): InverterRow {
  const cells = {
    kw: kwShown(entry.ac_kw),
    mppt: shown(entry.mppt, 0),
    window: `${shown(entry.vmpp_min_v, 0)}–${shown(entry.vmpp_max_v, 0)}`,
    vdc: shown(entry.vdc_max_v, 0),
  };
  return {
    model: entry.model,
    second: makerOf(entry.maker),
    cells,
    phone: `${cells.kw} kW · ${cells.mppt} MPPT · ${cells.window} V`,
    preliminary: entry.preliminary,
  };
}

/** An inverter's mark in the picker when it is rated under the system voltage set: the strings are sized to its rating (D88). */
export function ratedUnderOf(rating: number, voltage: number | null): string | null {
  if (voltage === null || rating <= 0 || rating >= voltage) return null;
  return `Up to ${Math.round(rating)}\u00a0V: strings sized under the ${voltage}\u00a0V set`;
}
