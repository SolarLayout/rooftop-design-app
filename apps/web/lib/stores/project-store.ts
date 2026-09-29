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
  open: (project: Project) => void;
  commit: (edit: Edit) => void;
};

export type ProjectStore = ReturnType<typeof createProjectStore>;

const NOT_OPEN = "No design is open: open one before it is edited.";

export function createProjectStore() {
  return createStore<ProjectState>()((set, get) => ({
    project: null,
    edit: 0,
    openedAt: null,

    open(project) {
      const edit = get().edit + 1;
      set({ project, edit, openedAt: edit });
    },

    commit(change) {
      const before = get().project;
      if (before === null) throw new Error(NOT_OPEN);
      const after = change(before);
      if (after === before) return;
      set({ project: after, edit: get().edit + 1 });
    },
  }));
}

export const projectOf = (state: ProjectState) => state.project;
export const editOf = (state: ProjectState) => state.edit;
export const openedAtOf = (state: ProjectState) => state.openedAt;
export const nameOf = (state: ProjectState) => state.project?.name ?? null;
export const latitudeOf = (state: ProjectState) => state.project?.roof.lat ?? null;
export const longitudeOf = (state: ProjectState) => state.project?.roof.lon ?? null;
export const systemVoltageOf = (state: ProjectState) => state.project?.system_voltage ?? null;
