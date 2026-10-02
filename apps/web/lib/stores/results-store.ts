// What the API answered for the design that is open: the layout and the design run, each with the edit
// it belongs to. A store without React.
//
// A result of before stays until a newer one is there. An answer to what was overtaken is dropped here,
// whoever brings it: a late answer never replaces a newer one.
import { createStore } from "zustand/vanilla";
import type { DesignProgress, DesignResult, LayoutResponse, SunResponse } from "../api";
import { stringsOfTheRunOf } from "../scene/string-colours";
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

/** The place and the day a sun is asked for: what tells one request from another. */
export type SunKey = { lat: number; lon: number; day: SunTime["day"] };

export const sunKeyOf = ({ lat, lon, day }: SunKey): string => `${lat},${lon},${day}`;

/** The sun at one hour of the day, in solar time: above the horizon, clockwise from north. */
export type SunPosition = { hour: number; elevationDeg: number; azimuthDeg: number };

/**
 * The sun of one day over the roof, as /sun answers it a quarter hour apart (plan/phase-06-plan.md,
 * decision 1), with the place and the day it was asked for. Sunrise and sunset are null where the sun
 * stays up or down.
 */
export type SunDay = SunKey & { dayOfYear: number; sunriseH: number | null; sunsetH: number | null; positions: SunPosition[] };

type KeptSun = {
  /** The last day that came; null when none ever came, or another design was opened. */
  value: SunDay | null;
  /** The key of the place and the day asked for last. */
  asked: string | null;
  failure: Failure | null;
};

/** A polygon of the API: an exterior and its holes, in the roof's metres. */
type Polygon = NonNullable<SunResponse["shadows"]>["polygons"][number];

/**
 * The engine's shadows of the parapet and the obstacles on the roof surface at one time (plan/phase-06-plan.md,
 * decisions 7 and 9), with the key of the roof, the day and the hour they are of.
 */
export type ShadowOutlines = { key: string; hour: number; polygons: Polygon[] };

type KeptShadows = {
  value: ShadowOutlines | null;
  /** The key of the roof, the day and the hour shown now: the outlines are shown only while they are of it. */
  wanted: string | null;
  failure: Failure | null;
};

export type ResultsState = {
  layout: Kept<LayoutResponse>;
  design: Kept<DesignResult>;
  sun: KeptSun;
  shadows: KeptShadows;
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
  /**
   * The option the document chose, when the run holds it: chosen at once, without a run, since every option is in
   * the run's answer (plan/phase-07-plan.md, decision 3). A key the run does not hold leaves the run's own choice.
   */
  optionChosen: (key: string) => void;

  sunAsked: (key: SunKey) => void;
  sunArrived: (day: SunDay) => void;
  sunFailed: (key: SunKey, failure: Failure) => void;

  /** The outlines of this key are wanted now; null when none are (the switch is off). */
  shadowsWanted: (key: string | null) => void;
  shadowsArrived: (outlines: ShadowOutlines) => void;
  shadowsFailed: (key: string, failure: Failure) => void;

  /** Another design is opened: nothing of the one before stays. */
  clear: () => void;
};

export type ResultsStore = ReturnType<typeof createResultsStore>;

const NOTHING = { value: null, edit: null, asked: null, status: "idle", failure: null } as const;
const NO_SUN: KeptSun = { value: null, asked: null, failure: null };
const NO_SHADOWS: KeptShadows = { value: null, wanted: null, failure: null };

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

/** The run with the option of *key* chosen, when it holds it; the same run otherwise. */
export function withTheChoice(design: DesignResult, key: string | null | undefined): DesignResult {
  if (!key || key === design.chosen_option || !design.options.some((option) => option.key === key)) return design;
  return { ...design, chosen_option: key };
}

export function createResultsStore() {
  return createStore<ResultsState>()((set, get) => ({
    layout: NOTHING,
    design: NOTHING,
    sun: NO_SUN,
    shadows: NO_SHADOWS,
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

    optionChosen(key) {
      const kept = get().design;
      const value = kept.value ? withTheChoice(kept.value, key) : null;
      if (value && value !== kept.value) set({ design: { ...kept, value } });
    },

    sunAsked: (key) => set({ sun: { ...get().sun, asked: sunKeyOf(key), failure: null } }),
    sunArrived(sun) {
      if (get().sun.asked === sunKeyOf(sun)) set({ sun: { value: sun, asked: get().sun.asked, failure: null } });
    },
    sunFailed(key, failure) {
      if (get().sun.asked === sunKeyOf(key)) set({ sun: { ...get().sun, failure } });
    },

    shadowsWanted: (wanted) => set((state) => (state.shadows.wanted === wanted ? state : { shadows: { ...state.shadows, wanted, failure: null } })),
    shadowsArrived(outlines) {
      if (get().shadows.wanted === outlines.key) set({ shadows: { ...get().shadows, value: outlines, failure: null } });
    },
    shadowsFailed(key, failure) {
      if (get().shadows.wanted === key) set({ shadows: { ...get().shadows, failure } });
    },

    clear: () => set({ layout: NOTHING, design: NOTHING, sun: NO_SUN, shadows: NO_SHADOWS, progress: null }),
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

/** The sun's day over the roof; null while none has come. */
export const sunDayOf = (state: ResultsState) => state.sun.value;

/** The engine's shadow outlines of the time shown; null while none are wanted, or none of that time have come. */
export function shadowOutlinesOf(state: ResultsState): ShadowOutlines | null {
  const { value, wanted } = state.shadows;
  return value && value.key === wanted ? value : null;
}

/** Why the sun asked for last did not come, in the words of the API. */
export const sunFailureOf = (state: ResultsState) => state.sun.failure;

/** Why there are no options, in the words of the API; null when there are some, or no result. */
export const noOptionsOf = (state: ResultsState) => state.design.value?.no_options ?? null;

/** The option that the result names as chosen: the vitals are its numbers. */
export function chosenOptionOf(state: ResultsState) {
  const design = state.design.value;
  if (!design || design.chosen_option === null) return null;
  return design.options.find((option) => option.key === design.chosen_option) ?? null;
}

/**
 * The chosen option's strings, while the run is of the layout shown (plan/phase-07-plan.md, decision 12): its edit
 * not older than the layout's and its count of positions the same. Null otherwise, and before a run.
 */
export function stringsOnTheRoofOf(state: ResultsState) {
  const { layout, design } = state;
  if (!layout.value || !design.value) return null;
  return stringsOfTheRunOf({
    option: chosenOptionOf(state),
    runEdit: design.edit,
    layoutEdit: layout.edit,
    runPositions: design.value.layout.modules.length,
    positions: layout.value.layout.modules.length,
  });
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
