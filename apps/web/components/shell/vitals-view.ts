// What the vitals show, made of the results and their status (docs/design/components.md, "Vitals bar"
// and "Vitals: states"). A pure function: the component draws what it gives.
import type { DesignOption, DesignProgress, DesignResult, LayoutReadouts } from "../../lib/api";
import {
  acCapacity,
  capacityIfAllWereUsed,
  dcAcRatio,
  dcCapacity,
  energy,
  modulesUsed,
  performanceRatio,
  positions,
  roofArea,
  specificYield,
  type Quantity,
} from "../../lib/format/vitals";
import type { Status } from "../../lib/stores/results-store";
import { wordsOfTheTarget, type Note } from "./notes-view";
import { pathOfNoOptions } from "../../lib/flow/no-options";

export type VitalId = "energy" | "dc" | "ac" | "dcac" | "modules" | "pr" | "yield" | "roof" | "positions" | "if-all-used";

export type Vital = {
  id: VitalId;
  label: string;
  quantity: Quantity;
  /** A tick or a note. There is no third mark. */
  mark?: { kind: "fits" | "note"; label: string };
};

export type LastCell =
  /** How many notes there are to review, and what the first is about. It opens the notes. */
  | { kind: "notes"; count: number; title: string; detail: string }
  /** A run is on its way: its step in the words of the engine, and how far it is, from 0 to 1. */
  | { kind: "run"; title: string; step: string | null; share: number }
  /** The run failed. It opens the notes, where the reason is. */
  | { kind: "failed"; title: string; detail: string }
  /** There are no options, and why, in the words of the API. It leads to where that is decided. */
  | { kind: "decision"; title: string; detail: string; path: string };

export type VitalsView = {
  /** The values of a design, or what the layout alone gives: the roof and its positions. */
  kind: "design" | "layout";
  cells: Vital[];
  /** No value was ever there: skeletons stand in their place. */
  isLoading: boolean;
  /** The values are of before, and new ones are on their way. */
  isDimmed: boolean;
  last: LastCell;
};

type Asked = {
  /** The name of the design that is open. */
  name: string | null;
  design: DesignResult | null;
  /** The read-outs of the layout: of the newer of layout and design. */
  readouts: LayoutReadouts | null;
  designStatus: Status;
  progress: DesignProgress | null;
  notes: readonly Note[];
};

/** The words of a run on its way, of a run that failed and of the first load: the vitals' and Performance's alike. */
export const UPDATING_ENERGY = "Updating energy";
export const openingOf = (name: string | null) => `Opening ${name ?? "the design"}`;
export const TRY_AGAIN = "Try again";
export const ENERGY_NOT_UPDATED = { title: "Energy was not updated", detail: "Values are of the design before" } as const;
export const ENERGY_NOT_COMPUTED = { title: "Energy was not computed", detail: "There are no values yet" } as const;

function chosenOf(design: DesignResult | null): DesignOption | null {
  if (!design || design.chosen_option === null) return null;
  return design.options.find((option) => option.key === design.chosen_option) ?? null;
}

function ofTheDesign(option: DesignOption, readouts: LayoutReadouts): Vital[] {
  return [
    { id: "energy", label: "Energy, year 1", quantity: energy(option.energy.energy_mwh) },
    { id: "dc", label: "DC capacity", quantity: dcCapacity(option.dc_kwp) },
    { id: "ac", label: "AC capacity", quantity: acCapacity(option.energy.ac_kw) },
    {
      id: "dcac",
      label: "DC/AC",
      quantity: dcAcRatio(option.dcac),
      mark: { kind: option.ok ? "fits" : "note", label: wordsOfTheTarget(option) },
    },
    { id: "modules", label: "Modules", quantity: modulesUsed(option.n_modules, readouts.positions) },
    { id: "pr", label: "PR", quantity: performanceRatio(option.energy.pr) },
    { id: "yield", label: "Yield", quantity: specificYield(option.energy.specific_yield) },
  ];
}

function ofTheLayout(readouts: LayoutReadouts | null, design: DesignResult | null): Vital[] {
  if (!readouts) return [];
  const cells: Vital[] = [
    { id: "roof", label: "Roof", quantity: roofArea(readouts.roof_area_m2) },
    { id: "positions", label: "Positions", quantity: positions(readouts.positions) },
  ];
  // The power of a module is known once a run has read the equipment.
  if (design) {
    cells.push({
      id: "if-all-used",
      label: "If all were used",
      quantity: capacityIfAllWereUsed(readouts.positions, design.equipment.module.pnom_w),
    });
  }
  return cells;
}

function notesCell(notes: readonly Note[]): LastCell {
  const [first] = notes;
  if (!first) return { kind: "notes", count: 0, title: "Nothing to review", detail: "Every check of the design fits." };
  const title = notes.length === 1 ? "1 note to review" : `${notes.length} notes to review`;
  return { kind: "notes", count: notes.length, title, detail: first.title };
}

export function vitalsOf({ name, design, readouts, designStatus, progress, notes }: Asked): VitalsView {
  const option = chosenOf(design);
  const isOnItsWay = designStatus === "waiting" || designStatus === "running";
  // Before the first answer, and before the design itself is there, nothing has failed and nothing is shown yet.
  const isLoading = design === null && designStatus !== "failed";

  const last = ((): LastCell => {
    if (isOnItsWay || isLoading) {
      const title = design ? UPDATING_ENERGY : openingOf(name);
      return { kind: "run", title, step: progress?.step ?? null, share: progress?.fraction ?? 0 };
    }
    if (designStatus === "failed") {
      const { title, detail } = design ? ENERGY_NOT_UPDATED : ENERGY_NOT_COMPUTED;
      return { kind: "failed", title, detail: `${detail} · ${TRY_AGAIN}` };
    }
    if (design?.no_options) {
      const { title, message } = design.no_options;
      return { kind: "decision", title, detail: message, path: pathOfNoOptions(design.no_options) };
    }
    return notesCell(notes);
  })();

  if (isLoading) return { kind: "design", cells: [], isLoading, isDimmed: false, last };

  const current = readouts ?? design?.readouts ?? null;
  if (option && current) return { kind: "design", cells: ofTheDesign(option, current), isLoading, isDimmed: isOnItsWay, last };
  return { kind: "layout", cells: ofTheLayout(current, design), isLoading, isDimmed: isOnItsWay, last };
}
