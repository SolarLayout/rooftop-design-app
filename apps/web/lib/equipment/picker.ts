// The pure parts of the equipment picker (D75; docs/design/components.md, "Choose a module or an inverter"): the search,
// the filters of the range sliders, the sorting by the columns that hold one value, and the words of the list.
import type { InverterEntry, ModuleEntry } from "./catalog";
import { makerOf } from "./makers";

export type Span = readonly [from: number, to: number];
export type Direction = "ascending" | "descending";
export type PickerSort = { key: string; direction: Direction };

/** A column that sorts: what it sorts by, and the way of a first press on its head (the figures downwards, the names A to Z). */
export type SortColumn<Entry> = { key: string; label: string; by: (entry: Entry) => number | string; first: Direction };

type Searched = { maker: string; model: string; file: string; power?: string };

/** Whether every word typed is found in the maker (as the file states it or as people know it), the model, the file's name or the power (V2 · 10). */
export function matchesSearch(entry: Searched, search: string): boolean {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [entry.maker, makerOf(entry.maker), entry.model, entry.file, entry.power ?? ""].join(" ").toLowerCase();
  return words.every((word) => haystack.includes(word));
}

// ── The modules ──────────────────────────────────────────────────────────────

export type ModuleFilters = { search: string; wp: Span };

/** The scale of the power: from the library's lowest to its highest, to the fifty below and above, in steps of 5 Wp. */
export function powerScaleOf(modules: readonly ModuleEntry[]): { min: number; max: number; step: number } {
  if (modules.length === 0) return { min: 0, max: 50, step: 5 };
  const powers = modules.map((module) => module.wp);
  return { min: Math.floor(Math.min(...powers) / 50) * 50, max: Math.ceil(Math.max(...powers) / 50) * 50, step: 5 };
}

export function filteredModules(modules: readonly ModuleEntry[], filters: ModuleFilters): ModuleEntry[] {
  const [from, to] = filters.wp;
  return modules.filter((module) => module.wp >= from && module.wp <= to && matchesSearch({ ...module, power: `${module.wp} Wp` }, filters.search));
}

// ── The inverters ────────────────────────────────────────────────────────────

/** The steps of the AC power in kW, closer at the low end, where most of the library is. */
const KW_STEPS = [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];

/** The stops of the AC power's slider: the library's lowest, the steps between, its highest. A handle stands on a stop's index. */
export function kwStopsOf(inverters: readonly InverterEntry[]): number[] {
  if (inverters.length === 0) return [0, 1];
  const powers = inverters.map((inverter) => inverter.ac_kw);
  const [lowest, highest] = [Math.min(...powers), Math.max(...powers)];
  return [lowest, ...KW_STEPS.filter((kw) => kw > lowest && kw < highest), highest];
}

/** The stops of the maximum DC voltage's slider: the voltages the library holds, from the lowest. */
export function voltageStopsOf(inverters: readonly InverterEntry[]): number[] {
  if (inverters.length === 0) return [0, 1];
  return [...new Set(inverters.map((inverter) => inverter.vdc_max_v))].sort((a, b) => a - b);
}

/** The AC power and the maximum DC voltage as indices of their stops; the MPPT as counts. */
export type InverterFilters = { search: string; kw: Span; mppt: Span; vdc: Span };

const within = (value: number, span: Span, stops: readonly number[]) => value >= (stops[span[0]] ?? -Infinity) && value <= (stops[span[1]] ?? Infinity);

export function filteredInverters(inverters: readonly InverterEntry[], filters: InverterFilters, stops: readonly number[], volts: readonly number[]): InverterEntry[] {
  const [fewest, most] = filters.mppt;
  return inverters.filter(
    (inverter) =>
      within(inverter.ac_kw, filters.kw, stops) &&
      within(inverter.vdc_max_v, filters.vdc, volts) &&
      inverter.mppt >= fewest &&
      inverter.mppt <= most &&
      matchesSearch({ ...inverter, power: `${inverter.ac_kw} kW` }, filters.search),
  );
}

// ── The sorting ──────────────────────────────────────────────────────────────

export const MODULE_COLUMNS: ReadonlyArray<SortColumn<ModuleEntry>> = [
  { key: "model", label: "Model", by: (module) => module.model, first: "ascending" },
  { key: "wp", label: "Power", by: (module) => module.wp, first: "descending" },
  { key: "efficiency_pct", label: "Efficiency", by: (module) => module.efficiency_pct, first: "descending" },
  { key: "bifaciality", label: "Bifaciality", by: (module) => module.bifaciality ?? 0, first: "descending" },
];

export const INVERTER_COLUMNS: ReadonlyArray<SortColumn<InverterEntry>> = [
  { key: "model", label: "Model", by: (inverter) => inverter.model, first: "ascending" },
  { key: "ac_kw", label: "AC power", by: (inverter) => inverter.ac_kw, first: "descending" },
  { key: "mppt", label: "MPPT", by: (inverter) => inverter.mppt, first: "descending" },
  { key: "vdc_max_v", label: "Max DC voltage", by: (inverter) => inverter.vdc_max_v, first: "descending" },
];

/** The list opens sorted by power, upwards: the library's own order. */
export const MODULE_START: PickerSort = { key: "wp", direction: "ascending" };
export const INVERTER_START: PickerSort = { key: "ac_kw", direction: "ascending" };

const turned = (direction: Direction): Direction => (direction === "ascending" ? "descending" : "ascending");

/**
 * The sort after a press on the head of *key*. Another column: its first way. The same: turned after the first way, and
 * the order the list opens in after the second. The column of that order only turns.
 */
export function nextPickerSort<Entry>(sort: PickerSort, key: string, columns: ReadonlyArray<SortColumn<Entry>>, start: PickerSort): PickerSort {
  const column = columns.find((candidate) => candidate.key === key);
  if (!column) return sort;
  if (sort.key !== key) return { key, direction: column.first };
  if (key === start.key) return sort.direction === start.direction ? { key, direction: turned(start.direction) } : start;
  return sort.direction === column.first ? { key, direction: turned(column.first) } : start;
}

/** The entries in the order of *sort*, stable: entries that are equal keep the library's order. */
export function sortedEntries<Entry>(entries: readonly Entry[], columns: ReadonlyArray<SortColumn<Entry>>, sort: PickerSort): Entry[] {
  const column = columns.find((candidate) => candidate.key === sort.key);
  if (!column) return [...entries];
  const sign = sort.direction === "ascending" ? 1 : -1;
  return [...entries].sort((a, b) => {
    const [x, y] = [column.by(a), column.by(b)];
    return sign * (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)));
  });
}

const wordsOfWay = (isName: boolean, direction: Direction) =>
  isName ? (direction === "ascending" ? "A to Z" : "Z to A") : direction === "ascending" ? "low to high" : "high to low";

/** The orders of the select that stands for the heads on phone: each column both ways, the way the list opens in or the first way first. */
export function orderOptions<Entry>(columns: ReadonlyArray<SortColumn<Entry>>, start: PickerSort): { value: string; label: string }[] {
  return columns.flatMap((column) => {
    const isName = column.key === "model";
    const first = column.key === start.key ? start.direction : column.first;
    return [first, turned(first)].map((direction) => ({
      value: `${column.key}:${direction}`,
      label: `${column.label}, ${wordsOfWay(isName, direction)}`,
    }));
  });
}

/** The sort an order of the select stands for. */
export function sortOfOrder(order: string): PickerSort {
  const [key = "", direction] = order.split(":");
  return { key, direction: direction === "descending" ? "descending" : "ascending" };
}

// ── The words ────────────────────────────────────────────────────────────────

/** The models that come in more than one file: their rows add the file's data source. */
export function twinModels(entries: readonly { model: string }[]): Set<string> {
  const seen = new Map<string, number>();
  for (const entry of entries) seen.set(entry.model, (seen.get(entry.model) ?? 0) + 1);
  return new Set([...seen].flatMap(([model, count]) => (count > 1 ? [model] : [])));
}

export function countWords(shown: number, total: number, noun: string): string {
  return `${shown} of ${total} ${noun}`;
}

/** The press that shows the filters' sliders (V2 · 10: the search and the list first, the filters behind it). */
export const FILTER = "Filter";

/** Its words: "Filter · on" while a filter narrows the list. */
export const filterWordsOf = (isFiltered: boolean): string => (isFiltered ? `${FILTER} · on` : FILTER);

type Line = { shown: number; total: number; makers: number; thing: string; fileKind: string; isFiltered: boolean };

const counted = (count: number, one: string) => `${count} ${one}${count === 1 ? "" : "s"}`;

/** The line over the list: what the library holds and the file of one's own; once searched or filtered, how many of how many. */
export function pickerLineOf({ shown, total, makers, thing, fileKind, isFiltered }: Line): string {
  if (isFiltered) return countWords(shown, total, `${thing}s`);
  return `${counted(total, thing)} from ${counted(makers, "maker")}, or your own ${thing} file (${fileKind})`;
}
