"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createDesignFlow, type DesignFlow } from "@/lib/flow/design-flow";
import { createProjectStore, nameOf, type ProjectState, type ProjectStore } from "@/lib/stores/project-store";
import {
  createResultsStore,
  designFailureOf,
  designOf,
  designStatusOf,
  layoutFailureOf,
  newerLayoutNotesOf,
  progressOf,
  readoutsOf,
  type ResultsState,
  type ResultsStore,
} from "@/lib/stores/results-store";
import { createViewStore, type ViewState, type ViewStore } from "@/lib/stores/view-store";
import { notesOf, type Note } from "./notes-view";
import { vitalsOf, type VitalsView } from "./vitals-view";

type Stores = {
  project: ProjectStore;
  results: ResultsStore;
  view: ViewStore;
  flow: DesignFlow;
};

const Context = createContext<Stores | null>(null);

function createStores(): Stores {
  const project = createProjectStore();
  const results = createResultsStore();
  return { project, results, view: createViewStore(), flow: createDesignFlow({ project, results }) };
}

/** The stores of the design that is open, for everything inside the shell. The flow runs while the shell is there. */
export function StoresProvider({ children }: { children: ReactNode }) {
  const [stores] = useState(createStores);

  useEffect(() => {
    stores.flow.start();
    return () => stores.flow.stop();
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
