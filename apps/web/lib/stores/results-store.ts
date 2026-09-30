// What the API answered for the design that is open: the layout and the design run, each with the edit
// it belongs to. A store without React.
//
// A result of before stays until a newer one is there. An answer to what was overtaken is dropped here,
// whoever brings it: a late answer never replaces a newer one.
import { createStore } from "zustand/vanilla";
import type { DesignProgress, DesignResult, LayoutResponse } from "../api";
import type { SunTime } from "./view-store";

/** Waiting: a design run that is asked for and has not begun, because more edits may follow. */
export type Status = "idle" | "waiting" | "running" | "failed";

/** What failed, in the words of the API. */
export type Failure = { code: string; message: string };

type Kept<Value> = {
  /** The last good answer; null when none ever came. */
  value: Value | null;
  /** The edit that the answer belongs to. */
  edit: number | null;
  /** The edit that was asked for last. */
  asked: number | null;
  status: Status;
  /** Why the last that was asked for did not come. */
  failure: Failure | null;
};

/** Where the sun stands over the roof, and the place and the time it was asked for. */
export type SunAt = SunTime & { lat: number; lon: number; elevationDeg: number; azimuthDeg: number };

/** The place and the time a sun is asked for: what tells one request from another. */
export type SunKey = SunTime & { lat: number; lon: number };

export const sunKeyOf = ({ lat, lon, day, hour }: SunKey): string => `${lat},${lon},${day},${hour}`;

type KeptSun = {
  /** The last sun that came; null when none ever came, or another design was opened. */
  value: SunAt | null;
  /** The key of the place and the time asked for last. */
  asked: string | null;
  failure: Failure | null;
};

export type ResultsState = {
  layout: Kept<LayoutResponse>;
  design: Kept<DesignResult>;
  sun: KeptSun;
  /** How far the run is, from the engine. It is for showing: a run is over when its result is there. */
  progress: DesignProgress | null;

  layoutAsked: (edit: number) => void;
  layoutArrived: (edit: number, layout: LayoutResponse) => void;
  layoutFailed: (edit: number, failure: Failure) => void;

  designWaits: (edit: number) => void;
  designBegan: (edit: number) => void;
  designProgressed: (edit: number, progress: DesignProgress) => void;
  designArrived: (edit: number, design: DesignResult) => void;
  designFailed: (edit: number, failure: Failure) => void;

  sunAsked: (key: SunKey) => void;
  sunArrived: (sun: SunAt) => void;
  sunFailed: (key: SunKey, failure: Failure) => void;

  /** Another design is opened: nothing of the one before stays. */
  clear: () => void;
};

export type ResultsStore = ReturnType<typeof createResultsStore>;

const NOTHING = { value: null, edit: null, asked: null, status: "idle", failure: null } as const;
const NO_SUN: KeptSun = { value: null, asked: null, failure: null };

const asked = <Value>(kept: Kept<Value>, edit: number, status: Status): Kept<Value> => ({
  ...kept,
  asked: edit,
  status,
  failure: null,
});
const arrived = <Value>(kept: Kept<Value>, edit: number, value: Value): Kept<Value> => ({
  ...kept,
  value,
  edit,
  status: "idle",
  failure: null,
});
const failed = <Value>(kept: Kept<Value>, failure: Failure): Kept<Value> => ({ ...kept, status: "failed", failure });

export function createResultsStore() {
  return createStore<ResultsState>()((set, get) => ({
    layout: NOTHING,
    design: NOTHING,
    sun: NO_SUN,
    progress: null,

    layoutAsked: (edit) => set({ layout: asked(get().layout, edit, "running") }),
    layoutArrived(edit, layout) {
      if (get().layout.asked === edit) set({ layout: arrived(get().layout, edit, layout) });
    },
    layoutFailed(edit, failure) {
      if (get().layout.asked === edit) set({ layout: failed(get().layout, failure) });
    },

    designWaits: (edit) => set({ design: asked(get().design, edit, "waiting"), progress: null }),
    designBegan: (edit) => set({ design: asked(get().design, edit, "running"), progress: null }),
    designProgressed(edit, progress) {
      if (get().design.asked === edit && get().design.status === "running") set({ progress });
    },
    designArrived(edit, design) {
      if (get().design.asked === edit) set({ design: arrived(get().design, edit, design), progress: null });
    },
    designFailed(edit, failure) {
      if (get().design.asked === edit) set({ design: failed(get().design, failure), progress: null });
    },

    sunAsked: (key) => set({ sun: { ...get().sun, asked: sunKeyOf(key), failure: null } }),
    sunArrived(sun) {
      if (get().sun.asked === sunKeyOf(sun)) set({ sun: { value: sun, asked: get().sun.asked, failure: null } });
    },
    sunFailed(key, failure) {
      if (get().sun.asked === sunKeyOf(key)) set({ sun: { ...get().sun, failure } });
    },

    clear: () => set({ layout: NOTHING, design: NOTHING, sun: NO_SUN, progress: null }),
  }));
}

export const layoutOf = (state: ResultsState) => state.layout.value;
export const layoutEditOf = (state: ResultsState) => state.layout.edit;
export const layoutStatusOf = (state: ResultsState) => state.layout.status;
export const layoutFailureOf = (state: ResultsState) => state.layout.failure;
export const isLayoutUpdating = (state: ResultsState) => state.layout.status === "running";

export const designOf = (state: ResultsState) => state.design.value;
export const designEditOf = (state: ResultsState) => state.design.edit;
export const designStatusOf = (state: ResultsState) => state.design.status;
export const designFailureOf = (state: ResultsState) => state.design.failure;
export const isDesignUpdating = (state: ResultsState) => state.design.status === "waiting" || state.design.status === "running";
export const progressOf = (state: ResultsState) => state.progress;

/** The sun of the scene; null while none has come. */
export const sunOf = (state: ResultsState) => state.sun.value;

/** Why there are no options, in the words of the API; null when there are some, or no result. */
export const noOptionsOf = (state: ResultsState) => state.design.value?.no_options ?? null;

/** The option that the result names as chosen: the vitals are its numbers. */
export function chosenOptionOf(state: ResultsState) {
  const design = state.design.value;
  if (!design || design.chosen_option === null) return null;
  return design.options.find((option) => option.key === design.chosen_option) ?? null;
}

/** The read-outs of the layout: of the newer of the two answers that carry them. */
export function readoutsOf(state: ResultsState) {
  const { layout, design } = state;
  if (layout.value && (layout.edit ?? 0) > (design.edit ?? 0)) return layout.value.readouts;
  return design.value?.readouts ?? layout.value?.readouts ?? null;
}

/** The notes of a layout that is newer than the design; null when the design is not older, or there is no layout. */
export function newerLayoutNotesOf(state: ResultsState) {
  const { layout, design } = state;
  return layout.value && (layout.edit ?? 0) > (design.edit ?? 0) ? layout.value.layout.notes : null;
}
