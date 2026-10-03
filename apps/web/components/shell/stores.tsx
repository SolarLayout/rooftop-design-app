"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createToasts, type Toasts } from "@/components/ui/toast-queue";
import { api } from "@/lib/api";
import { createDesignFlow, type DesignFlow } from "@/lib/flow/design-flow";
import { createDownloadsStore, type DownloadsState, type DownloadsStore } from "@/lib/handover/downloads-store";
import { createProjectStore, editOf, nameOf, projectOf, type ProjectState, type ProjectStore } from "@/lib/stores/project-store";
import { createResultsStore, designFailureOf, designOf, designStatusOf, layoutFailureOf, newerLayoutNotesOf, progressOf, readoutsOf, sunDayOf, type ResultsState, type ResultsStore } from "@/lib/stores/results-store";
import { createViewStore, type ViewState, type ViewStore } from "@/lib/stores/view-store";
import { CLOCK_OF_THE_BROWSER } from "@/lib/clock";
import { hoursOf } from "@/lib/scene/sun-day";
import { createPlay, type Play } from "@/lib/studio/play";
import { notesOf, type Note } from "./notes-view";
import { vitalsOf, type VitalsView } from "./vitals-view";

type Stores = {
  project: ProjectStore;
  results: ResultsStore;
  view: ViewStore;
  flow: DesignFlow;
  /** Play of the time: one for the app, so that the pill of every lens and the timeline are one. */
  play: Play;
  /** What the app says in a few words at the bottom of the screen: one queue, shown by the shell's Toaster. */
  toasts: Toasts;
  /** The downloads of Handover: the files of the API saved by the browser. */
  downloads: DownloadsStore;
};

const Context = createContext<Stores | null>(null);

function createStores(): Stores {
  const project = createProjectStore();
  const results = createResultsStore();
  const view = createViewStore();
  const play = createPlay({
    view,
    clock: CLOCK_OF_THE_BROWSER,
    hoursOf: () => {
      const day = sunDayOf(results.getState());
      return day ? hoursOf(day) : null;
    },
    isReduced: () => window.matchMedia(REDUCED_MOTION).matches,
  });
  const toasts = createToasts();
  const downloads = createDownloadsStore({
    api,
    toasts,
    open: () => {
      const state = project.getState();
      const document = projectOf(state);
      return document === null ? null : { document, edit: editOf(state), chosen: designOf(results.getState())?.chosen_option ?? null };
    },
  });
  // Another design opened: the files of the one before are not its.
  project.subscribe((state, before) => {
    if (state.openedAt !== before.openedAt) downloads.getState().clear();
  });
  return { project, results, view, flow: createDesignFlow({ project, results, view }), play, toasts, downloads };
}

/** What the user's system says of motion (decision 4: under it, play moves an hour a second). */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The stores of the design that is open, for the whole app: a roof outlined on the map is the design the
 * workspaces show. The flow runs while the app is there. Nothing is opened here: the shell opens the demo
 * when a workspace has no design, and Find opens what was built.
 */
export function StoresProvider({ children }: { children: ReactNode }) {
  const [stores] = useState(createStores);

  useEffect(() => {
    stores.flow.start();
    return () => {
      stores.flow.stop();
      stores.play.stop();
    };
  }, [stores]);

  return <Context.Provider value={stores}>{children}</Context.Provider>;
}

export function useStores(): Stores {
  const stores = useContext(Context);
  if (stores === null) throw new Error("The stores are read outside the shell: put the component inside StoresProvider.");
  return stores;
}

/** One value of the project. The selector is one of lib/stores/project-store.ts. */
export function useProject<Value>(selector: (state: ProjectState) => Value): Value {
  return useStore(useStores().project, selector);
}

/** One value of the results. The selector is one of lib/stores/results-store.ts. */
export function useResults<Value>(selector: (state: ResultsState) => Value): Value {
  return useStore(useStores().results, selector);
}

/** One value of the downloads. The selector is one of lib/handover/downloads-store.ts. */
export function useDownloads<Value>(selector: (state: DownloadsState) => Value): Value {
  return useStore(useStores().downloads, selector);
}

/** The queue of what the app says. */
export function useToasts(): Toasts {
  return useStores().toasts;
}

/** One value of the view. The selector is one of lib/stores/view-store.ts. */
export function useView<Value>(selector: (state: ViewState) => Value): Value {
  return useStore(useStores().view, selector);
}

/** The notes to review of the design that is open. */
export function useNotes(): Note[] {
  const design = useResults(designOf);
  const layoutNotes = useResults(newerLayoutNotesOf);
  const designFailure = useResults(designFailureOf);
  const layoutFailure = useResults(layoutFailureOf);

  return useMemo(() => notesOf({ design, layoutNotes, designFailure, layoutFailure }), [design, layoutNotes, designFailure, layoutFailure]);
}

/** What the vitals show of the design that is open. */
export function useVitals(notes: readonly Note[]): VitalsView {
  const name = useProject(nameOf);
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const designStatus = useResults(designStatusOf);
  const progress = useResults(progressOf);

  return useMemo(
    () => vitalsOf({ name, design, readouts, designStatus, progress, notes }),
    [name, design, readouts, designStatus, progress, notes],
  );
}
