// The design that is open: the .rtd document, as the API hands it out. A store without React.
//
// Nothing here has a default but one: a design opened without a system voltage gets the one of the user's country,
// set by the app (D87), from whoever made the store.
import { createStore } from "zustand/vanilla";
import type { Project } from "../api";
import type { DefaultVoltage } from "../country/country";

/** What a committed edit makes of the document. It gives back a new one and leaves the old as it was. */
export type Edit = (project: Project) => Project;

export type ProjectState = {
  project: Project | null;
  /**
   * How many times the document changed: by being opened, by a committed edit. A result says which of
   * them it belongs to.
   */
  edit: number;
  /** The edit at which the design that is open was opened. */
  openedAt: number | null;
  /** The documents of before, the latest last, as many as KEPT_EDITS; what an undo can go back to. */
  past: Project[];
  /** The documents undone, the nearest last; what a redo goes forward to. */
  future: Project[];
  open: (project: Project) => void;
  commit: (edit: Edit) => void;
  /**
   * Replaces the document of the edit that is current, without an edit of its own: nothing is counted, nothing is
   * kept for undo. For what belongs to the document of that edit and the user did not do: the weather the flow
   * loaded for it (plan/phase-08-plan.md, decision 11). Gives the document back; null once another edit is current,
   * or before a design is open.
   */
  amend: (edit: number, change: Edit) => Project | null;
  undo: () => void;
  redo: () => void;
};

export type ProjectStore = ReturnType<typeof createProjectStore>;

const NOT_OPEN = "No design is open: open one before it is edited.";

/** How many edits can be undone (plan/phase-05-plan.md, decision 11). */
export const KEPT_EDITS = 50;

type Options = {
  /** The voltage a design opened without one gets: the user's country's, asked when it is opened. None: it gets none. */
  voltageOfANewDesign?: () => DefaultVoltage;
};

/** The document with the voltage of the user's country when it has none, set by the app. */
function withAVoltage(project: Project, voltageOfANewDesign: Options["voltageOfANewDesign"]): Project {
  if (project.system_voltage !== null && project.system_voltage !== undefined) return project;
  if (!voltageOfANewDesign) return project;
  return { ...project, system_voltage: voltageOfANewDesign(), system_voltage_by: "app" };
}

export function createProjectStore({ voltageOfANewDesign }: Options = {}) {
  return createStore<ProjectState>()((set, get) => ({
    project: null,
    edit: 0,
    openedAt: null,
    past: [],
    future: [],

    open(project) {
      const edit = get().edit + 1;
      set({ project: withAVoltage(project, voltageOfANewDesign), edit, openedAt: edit, past: [], future: [] });
    },

    commit(change) {
      const before = get().project;
      if (before === null) throw new Error(NOT_OPEN);
      const after = change(before);
      if (after === before) return;
      set({ project: after, edit: get().edit + 1, past: [...get().past, before].slice(-KEPT_EDITS), future: [] });
    },

    amend(edit, change) {
      const before = get().project;
      if (before === null || get().edit !== edit) return null;
      const after = change(before);
      if (after !== before) set({ project: after });
      return after;
    },

    undo() {
      const { project, past, future } = get();
      const before = past.at(-1);
      if (project === null || before === undefined) return;
      set({ project: before, edit: get().edit + 1, past: past.slice(0, -1), future: [...future, project] });
    },

    redo() {
      const { project, past, future } = get();
      const after = future.at(-1);
      if (project === null || after === undefined) return;
      set({ project: after, edit: get().edit + 1, past: [...past, project].slice(-KEPT_EDITS), future: future.slice(0, -1) });
    },
  }));
}

export const projectOf = (state: ProjectState) => state.project;
export const canUndo = (state: ProjectState) => state.past.length > 0;
export const canRedo = (state: ProjectState) => state.future.length > 0;
export const editOf = (state: ProjectState) => state.edit;
export const openedAtOf = (state: ProjectState) => state.openedAt;
export const nameOf = (state: ProjectState) => state.project?.name ?? null;
export const latitudeOf = (state: ProjectState) => state.project?.roof.lat ?? null;
export const longitudeOf = (state: ProjectState) => state.project?.roof.lon ?? null;
export const systemVoltageOf = (state: ProjectState) => state.project?.system_voltage ?? null;
export const degradationOf = (state: ProjectState) => state.project?.losses.degradation_pct ?? null;
export const weatherSourceOf = (state: ProjectState) => state.project?.weather_source ?? null;
/** The name of the document's CSV weather file; empty for PVGIS and NASA. */
export const weatherCsvOf = (state: ProjectState) => state.project?.weather_csv ?? null;
