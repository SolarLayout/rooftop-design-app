"use client";

import { HelpProvider } from "./help/HelpProvider";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { shouldWarnBeforeLeaving } from "@/lib/device/leaving";
import { openFromTheSwitcher } from "@/lib/device/opening";
import { idOf, keptDesignsOf, savingOf } from "@/lib/device/saving";
import { withName } from "@/lib/flow/name-field";
import { nameOf } from "@/lib/stores/project-store";
import { OpenProject } from "@/components/shell/OpenProject";
import { Toaster } from "@/components/ui/Toaster";
import { ImportDrawing } from "./ImportDrawing";
import { NotesDrawer } from "./NotesDrawer";
import type { Note } from "./notes-view";
import { resultChipOf, summaryOf } from "./result-view";
import { StepTabBar } from "./StepNav";
import { useDownloads, useNotes, useProject, useSaving, useStores, useToasts, useVitals } from "./stores";
import { useProgression, type Progression } from "./use-progression";
import { rowsOnTheDeviceOf } from "./switcher-view";
import { TopBar } from "./TopBar";
import { useOpensWhatBelongs } from "./use-opens-what-belongs";
import { useSaysChoiceGone } from "./use-says-choice-gone";

type Notes = { notes: readonly Note[]; open: () => void };

const NotesContext = createContext<Notes | null>(null);
const ProgressionContext = createContext<Progression | null>(null);

/** The order of work as the shell has it: the step in hand, the state of each, the steps opened (D95). */
export function useProgressionOfTheShell(): Progression {
  const progression = useContext(ProgressionContext);
  if (progression === null) throw new Error("The steps are read outside the shell: put the component inside Shell.");
  return progression;
}

/** The notes to review, and what opens their drawer. */
export function useNotesOfTheShell(): Notes {
  const notes = useContext(NotesContext);
  if (notes === null) throw new Error("The notes are read outside the shell: put the component inside Shell.");
  return notes;
}

function Frame({ children }: { children: ReactNode }) {
  const { flow, project, downloads, saving } = useStores();
  useOpensWhatBelongs();
  const name = useProject(nameOf);
  const savingState = useSaving(savingOf);
  const kept = useSaving(keptDesignsOf);
  const keptId = useSaving(idOf);
  const shouldWarn = useDownloads(shouldWarnBeforeLeaving);
  const notes = useNotes();
  const vitals = useVitals(notes);
  const progression = useProgression();
  const toasts = useToasts();
  const [areNotesOpen, setNotesOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isOpenProjectOpen, setOpenProjectOpen] = useState(false);
  useSaysChoiceGone();

  // While a file of Handover is on its way the browser asks before the page is left (plan/phase-10-plan.md, step 6).
  useEffect(() => {
    if (!shouldWarn) return;
    function ask(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Older browsers ask only when a value is set; the words are the browser's own.
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", ask);
    return () => window.removeEventListener("beforeunload", ask);
  }, [shouldWarn]);

  // The page left within the debounce of a save (a reload, a closed tab): what waits is written now, not lost.
  useEffect(() => {
    const flush = () => saving.getState().flush();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [saving]);

  const ofTheShell = useMemo(() => ({ notes, open: () => setNotesOpen(true) }), [notes]);
  const designs = useMemo(() => rowsOnTheDeviceOf(kept, keptId), [kept, keptId]);
  const say = (words: string) => void toasts.show({ kind: "note", words });

  return (
    <NotesContext.Provider value={ofTheShell}>
      <ProgressionContext.Provider value={progression}>
      {/* The container of the top bar's widths, tablet-wide and desktop-wide: its room, the sides kept clear left out. */}
      <div className="@container/shell flex h-dvh flex-col overflow-hidden">
        <TopBar
          name={name}
          saving={savingState}
          step={progression.current}
          states={progression.states}
          result={resultChipOf(vitals)}
          summary={summaryOf(vitals)}
          onOpenNotes={ofTheShell.open}
          onImport={() => setImportOpen(true)}
          onOpenProject={() => setOpenProjectOpen(true)}
          // The name is a committed edit like any other, undone by key (plan/phase-09-plan.md, decision 13).
          onRename={(name) => project.getState().commit((document) => withName(document, name))}
          onSaveACopy={() => void downloads.getState().download("project-file")}
          designs={designs}
          onOpenDesign={(id) => void openFromTheSwitcher(id, { openFromDevice: (one) => saving.getState().openFromDevice(one), say })}
        />
        <div data-workspace-frame className="relative flex min-h-0 grow flex-col overflow-y-auto">
          <HelpProvider>{children}</HelpProvider>
        </div>
        <StepTabBar current={progression.current} states={progression.states} />
      </div>
      {/* Try again asks again for what failed, whichever it was: a call of the API, or the write to the device. Each does nothing when nothing of its failed. */}
      <NotesDrawer
        open={areNotesOpen}
        notes={notes}
        onClose={() => setNotesOpen(false)}
        onTryAgain={() => {
          flow.tryAgain();
          saving.getState().tryAgain();
        }}
      />
      <ImportDrawing open={isImportOpen} onClose={() => setImportOpen(false)} />
      <OpenProject open={isOpenProjectOpen} onClose={() => setOpenProjectOpen(false)} />
      {/* What the app says, in the page from the start: a download that failed (plan/phase-09-plan.md, decision 12). */}
      <Toaster toasts={toasts} aboveTheTabBar />
      </ProgressionContext.Provider>
    </NotesContext.Provider>
  );
}

/** What the steps after Find share: one design, the top bar with the steps and the result, the notes. */
export function Shell({ children }: { children: ReactNode }) {
  return <Frame>{children}</Frame>;
}
