// Saving the design that is open to this device (plan/phase-10-plan.md, step 2, decisions 2 and 3): a store without
// React. It hears the project store: a committed edit (an undo and a redo too) of a design that is kept, or any
// committed edit of one not yet kept, writes the kept design SAVE_DEBOUNCE after the last edit, so that edits shortly
// after each other are one write. The demo is not kept until it is edited (D32); then it is a design like any other,
// under an id made here. The facts of the card follow the last run, so a run that lands is written too. The id of
// the open design is remembered (lib/device/remembered.ts, one key of localStorage) so that a reload finds it; a design
// not kept remembers nothing.
// A write that fails says Not saved with the device's words; the next edit, or Try again, tries again.
import { createStore } from "zustand/vanilla";
import { SAVE_DEBOUNCE } from "../../components/ui/design-numbers";
import { CLOCK_OF_THE_BROWSER, type Clock } from "../clock";
import type { ProjectState, ProjectStore } from "../stores/project-store";
import { designOf, type ResultsState, type ResultsStore } from "../stores/results-store";
import type { DesignsDb } from "./designs-db";
import { keptOf, type KeptDesign } from "./kept-design";

/** Not kept: the demo and every design before its first edit. Not saved: the device refused the last write. */
export type Saving = "not-kept" | "saving" | "saved" | "not-saved";

export type SavingState = {
  saving: Saving;
  /** Why the design could not be saved, in the device's words; null otherwise. */
  failure: string | null;
  /** The id the open design is kept under; null while it is not kept. */
  id: string | null;
  /** The designs kept on this device, the newest edited first. */
  designs: KeptDesign[];
  /**
   * Opens the design of this id from the device: the document into the project store (the flow then runs it as it
   * runs the demo), the state Saved, the id remembered. False when the device has none of that id; throws the device's
   * words when it cannot be read. The design that is open already is left as it is.
   */
  openFromDevice: (id: string) => Promise<boolean>;
  /** Writes again at once what the device refused. */
  tryAgain: () => void;
  /** Reads the designs of the device: in the browser, once the app is there (the stores are made on the server too). */
  start: () => void;
  /** Hears the stores no longer. */
  stop: () => void;
};

export type SavingStore = ReturnType<typeof createSaving>;

type Options = {
  project: ProjectStore;
  results: ResultsStore;
  db: DesignsDb;
  clock?: Clock;
  /** Keeps the id of the open design across a reload; null forgets it. */
  remember: (id: string | null) => void;
  /** Milliseconds since the epoch. */
  now?: () => number;
  /** The id of a design first kept. */
  newId?: () => string;
  /** Where a failure that is not the open design's is said: a write of the design before, the list that could not be read. */
  say?: (words: string) => void;
};

/** What is known of the open design on this device. */
type Current = { id: string | null; editedAt: number; openedAt: number };

const nowOfTheBrowser = () => Date.now();
const idOfTheBrowser = () => crypto.randomUUID();
const wordsOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function createSaving({ project, results, db, clock = CLOCK_OF_THE_BROWSER, remember, now = nowOfTheBrowser, newId = idOfTheBrowser, say }: Options) {
  let current: Current = { id: null, editedAt: 0, openedAt: 0 };
  /** The design opened from the device, until the project store says it is open. */
  let expected: KeptDesign | null = null;
  /** The record to write next, made of the stores when the edit was heard; null when nothing waits. */
  let pending: KeptDesign | null = null;
  let giveUpTheWait: (() => void) | null = null;

  const store = createStore<SavingState>()((set, get) => {
    /** The designs listed with *kept* in the place of the one of its id, the newest edited first. */
    function listedWith(kept: KeptDesign): KeptDesign[] {
      return [kept, ...get().designs.filter((one) => one.id !== kept.id)].sort((a, b) => b.editedAt - a.editedAt);
    }

    function write(record: KeptDesign) {
      pending = null;
      db.putDesign(record).then(
        () => {
          set({ designs: listedWith(record) });
          if (current.id !== record.id) return;
          remember(record.id);
          // An edit heard meanwhile waits for its own write: the state stays Saving.
          if (pending === null) set({ saving: "saved", failure: null });
        },
        (error: unknown) => {
          const words = wordsOf(error);
          if (current.id !== record.id) return say?.(words);
          set({ saving: "not-saved", failure: words });
        },
      );
    }

    function writeWhatWaits() {
      giveUpTheWait?.();
      giveUpTheWait = null;
      if (pending !== null) write(pending);
    }

    /** The open design as it is now, to be written: the document and the last run of the stores, the times of *current*. */
    function recordOf(id: string): KeptDesign {
      const document = project.getState().project;
      if (document === null) throw new Error("No design is open: nothing can be kept.");
      return { ...keptOf({ id, document, design: designOf(results.getState()), now: current.editedAt }), openedAt: current.openedAt };
    }

    function schedule(id: string) {
      pending = recordOf(id);
      set({ saving: "saving", failure: null });
      giveUpTheWait?.();
      giveUpTheWait = clock.after(SAVE_DEBOUNCE, () => {
        giveUpTheWait = null;
        if (pending !== null) write(pending);
      });
    }

    function opened() {
      // What the design before had on its way is written now, under its own id.
      writeWhatWaits();
      const kept = expected;
      expected = null;
      if (kept === null) {
        current = { id: null, editedAt: 0, openedAt: now() };
        set({ saving: "not-kept", failure: null, id: null });
        remember(null);
        return;
      }
      current = { id: kept.id, editedAt: kept.editedAt, openedAt: now() };
      set({ saving: "saved", failure: null, id: kept.id });
      remember(kept.id);
      // The time of opening goes into the record; the facts stay what they were until a run lands here.
      const record = { ...kept, openedAt: current.openedAt };
      db.putDesign(record).then(
        () => set({ designs: listedWith(record) }),
        (error: unknown) => {
          if (current.id === kept.id) set({ saving: "not-saved", failure: wordsOf(error) });
        },
      );
    }

    function edited() {
      const id = current.id ?? newId();
      current = { id, editedAt: now(), openedAt: current.openedAt };
      set({ id });
      schedule(id);
    }

    function heardTheProject(state: ProjectState, before: ProjectState) {
      if (state.project === before.project) return;
      if (state.openedAt !== before.openedAt) return opened();
      if (state.edit !== before.edit) return edited();
      // An amendment (the weather loaded for the edit): part of the kept document, no edit of its own.
      if (current.id !== null) schedule(current.id);
    }

    function heardTheResults(state: ResultsState, before: ResultsState) {
      const design = designOf(state);
      if (design === null || design === designOf(before) || current.id === null) return;
      schedule(current.id);
    }

    const stopHearingTheProject = project.subscribe(heardTheProject);
    const stopHearingTheResults = results.subscribe(heardTheResults);

    return {
      saving: "not-kept",
      failure: null,
      id: null,
      designs: [],

      async openFromDevice(id) {
        if (current.id === id && project.getState().project !== null) return true;
        const kept = await db.getDesign(id);
        if (kept === null) return false;
        expected = kept;
        project.getState().open(kept.document);
        return true;
      },

      tryAgain() {
        if (get().saving !== "not-saved" || current.id === null) return;
        pending = recordOf(current.id);
        set({ saving: "saving", failure: null });
        writeWhatWaits();
      },

      start() {
        db.listDesigns().then(
          (designs) => set({ designs: [...designs].sort((a, b) => b.editedAt - a.editedAt) }),
          (error: unknown) => say?.(wordsOf(error)),
        );
      },

      stop() {
        stopHearingTheProject();
        stopHearingTheResults();
        giveUpTheWait?.();
        giveUpTheWait = null;
        pending = null;
      },
    };
  });

  return store;
}

export const savingOf = (state: SavingState) => state.saving;
export const failureOf = (state: SavingState) => state.failure;
export const idOf = (state: SavingState) => state.id;
export const keptDesignsOf = (state: SavingState) => state.designs;
