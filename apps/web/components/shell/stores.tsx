"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createToasts, type Toasts } from "@/components/ui/toast-queue";
import { api } from "@/lib/api";
import { createDesignFlow, type DesignFlow } from "@/lib/flow/design-flow";
import { demoRunOf, rememberDemoRunIn } from "@/lib/device/demo-run";
import { designsDb } from "@/lib/device/designs-db";
import { rememberIn } from "@/lib/device/remembered";
import { createSaving, failureOf as savingFailureOf, type SavingState, type SavingStore } from "@/lib/device/saving";
import { createChoicesGone, type ChoicesGoneStore } from "@/lib/stores/choices-gone";
import { createDownloadsStore, type DownloadsState, type DownloadsStore } from "@/lib/stores/downloads-store";
import { createProjectStore, editOf, nameOf, projectOf, type ProjectState, type ProjectStore } from "@/lib/stores/project-store";
import { createResultsStore, designFailureOf, designOf, designStatusOf, layoutFailureOf, newerLayoutNotesOf, progressOf, readoutsOf, sunDayOf, type ResultsState, type ResultsStore } from "@/lib/stores/results-store";
import { createViewStore, type ViewState, type ViewStore } from "@/lib/stores/view-store";
import { CLOCK_OF_THE_BROWSER } from "@/lib/clock";
import { askCountry, createCountry, defaultVoltageOf, type Country } from "@/lib/country/country";
import { hoursOf } from "@/lib/flow/sun-day";
import { createPlay, type Play } from "@/lib/flow/play";
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
  /** The design kept on this device: its state of saving, the designs of the device (plan/phase-10-plan.md, step 2). */
  saving: SavingStore;
  /** The choices of stringing an edit took away, waiting for the shell to tell them. */
  choicesGone: ChoicesGoneStore;
  /** The user's country: a new design's system voltage, and the words that say where it came from (D87). */
  country: Country;
};

const Context = createContext<Stores | null>(null);

/** The browser's time zone; none on the server, where the stores are made too. */
function timeZoneOfTheBrowser(): string | null {
  return typeof window === "undefined" ? null : Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function createStores(): Stores {
  const country = createCountry({ ask: () => askCountry((path) => fetch(path)), timeZone: timeZoneOfTheBrowser });
  const project = createProjectStore({ voltageOfANewDesign: () => defaultVoltageOf(country.current()) });
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
  const saving = createSaving({
    project,
    results,
    db: designsDb,
    // The storage is the browser's: looked up when something is remembered, since the stores are made on the server too.
    remember: (id) => rememberIn(window.localStorage)(id),
    say: (words) => void toasts.show({ kind: "note", words }),
  });
  const choicesGone = createChoicesGone();
  const flow = createDesignFlow({
    project,
    results,
    view,
    // The untouched demo's run is remembered on this device, so that Home's card shows its numbers (plan/phase-10-plan.md, decision 5).
    onDemoRan: (design) => {
      const run = demoRunOf(design);
      if (run !== null) rememberDemoRunIn(window.localStorage)(run);
    },
    onChoiceGone: (gone) => choicesGone.getState().heard(gone),
  });
  return { project, results, view, flow, play, toasts, downloads, saving, choicesGone, country };
}

/** What the user's system says of motion (decision 4: under it, play moves an hour a second; Present's tour is cuts). */
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The stores of the design that is open, for the whole app: a roof outlined on the map is the design the
 * workspaces show. The flow runs while the app is there. Nothing is opened here: the shell opens the demo
 * when a workspace has no design, and Find opens what was built.
 */
export function StoresProvider({ children }: { children: ReactNode }) {
  const [stores] = useState(createStores);

  useEffect(() => {
    void stores.country.learn();
    stores.flow.start();
    stores.saving.getState().start();
    return () => {
      stores.flow.stop();
      stores.play.stop();
      stores.saving.getState().stop();
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

/** One value of the downloads. The selector is one of lib/stores/downloads-store.ts. */
export function useDownloads<Value>(selector: (state: DownloadsState) => Value): Value {
  return useStore(useStores().downloads, selector);
}

/** One value of the saving to this device. The selector is one of lib/device/saving.ts. */
export function useSaving<Value>(selector: (state: SavingState) => Value): Value {
  return useStore(useStores().saving, selector);
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
  const savingFailure = useSaving(savingFailureOf);

  return useMemo(
    () => notesOf({ design, layoutNotes, designFailure, layoutFailure, savingFailure }),
    [design, layoutNotes, designFailure, layoutFailure, savingFailure],
  );
}

/** What the vitals show of the design that is open. */
export function useVitals(notes: readonly Note[]): VitalsView {
  const name = useProject(nameOf);
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const designStatus = useResults(designStatusOf);
  const progress = useResults(progressOf);
  const failure = useResults(designFailureOf);

  return useMemo(
    () => vitalsOf({ name, design, readouts, designStatus, progress, notes, failure }),
    [name, design, readouts, designStatus, progress, notes, failure],
  );
}
