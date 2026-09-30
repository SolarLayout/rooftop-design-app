// The design that is open: the .rtd document, as the API hands it out. A store without React.
//
// Nothing here has a default. The system voltage least of all: it is the one of the document, or none,
// until the user chooses.
import { createStore } from "zustand/vanilla";
import type { Project } from "../api";

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
  undo: () => void;
  redo: () => void;
};

export type ProjectStore = ReturnType<typeof createProjectStore>;

const NOT_OPEN = "No design is open: open one before it is edited.";

/** How many edits can be undone (plan/phase-05-plan.md, decision 11). */
export const KEPT_EDITS = 50;

export function createProjectStore() {
  return createStore<ProjectState>()((set, get) => ({
    project: null,
    edit: 0,
    openedAt: null,
    past: [],
    future: [],

    open(project) {
      const edit = get().edit + 1;
      set({ project, edit, openedAt: edit, past: [], future: [] });
    },

    commit(change) {
      const before = get().project;
      if (before === null) throw new Error(NOT_OPEN);
      const after = change(before);
      if (after === before) return;
      set({ project: after, edit: get().edit + 1, past: [...get().past, before].slice(-KEPT_EDITS), future: [] });
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
