"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { shouldWarnBeforeLeaving } from "@/lib/device/leaving";
import { openFromTheSwitcher } from "@/lib/device/opening";
import { idOf, keptDesignsOf, savingOf } from "@/lib/device/saving";
import { placeInShort } from "@/lib/format/place";
import { withName } from "@/lib/flow/name-field";
import { workspaceOf } from "@/lib/routes";
import { latitudeOf, longitudeOf, nameOf } from "@/lib/stores/project-store";
import { lensOf } from "@/lib/stores/view-store";
import { OpenProject } from "@/components/shell/OpenProject";
import { Toaster } from "@/components/ui/Toaster";
import { ImportDrawing } from "./ImportDrawing";
import { NotesDrawer } from "./NotesDrawer";
import type { Note } from "./notes-view";
import { useDownloads, useNotes, useProject, useSaving, useStores, useToasts, useView } from "./stores";
import { rowsOnTheDeviceOf } from "./switcher-view";
import { TopBar } from "./TopBar";
import { useOpensWhatBelongs } from "./use-opens-what-belongs";
import { TabBar } from "./WorkspaceNav";

type Notes = { notes: readonly Note[]; open: () => void };

const NotesContext = createContext<Notes | null>(null);

/** The notes to review, and what opens their drawer. */
export function useNotesOfTheShell(): Notes {
  const notes = useContext(NotesContext);
  if (notes === null) throw new Error("The notes are read outside the shell: put the component inside Shell.");
  return notes;
}

function Frame({ children }: { children: ReactNode }) {
  const workspace = workspaceOf(usePathname());
  const { flow, project, downloads, saving } = useStores();
  useOpensWhatBelongs();
  const name = useProject(nameOf);
  const savingState = useSaving(savingOf);
  const kept = useSaving(keptDesignsOf);
  const keptId = useSaving(idOf);
  const shouldWarn = useDownloads(shouldWarnBeforeLeaving);
  const latitude = useProject(latitudeOf);
  const longitude = useProject(longitudeOf);
  const lens = useView(lensOf);
  const notes = useNotes();
  const toasts = useToasts();
  const [areNotesOpen, setNotesOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isOpenProjectOpen, setOpenProjectOpen] = useState(false);

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

  const place = latitude === null || longitude === null ? null : placeInShort(latitude, longitude);
  const ofTheShell = useMemo(() => ({ notes, open: () => setNotesOpen(true) }), [notes]);
  const designs = useMemo(() => rowsOnTheDeviceOf(kept, keptId), [kept, keptId]);
  const say = (words: string) => void toasts.show({ kind: "note", words });

  return (
    <NotesContext.Provider value={ofTheShell}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <TopBar
          name={name}
          place={place}
          workspace={workspace}
          lens={lens}
          saving={savingState}
          notes={notes.length}
          onOpenNotes={ofTheShell.open}
          onImport={() => setImportOpen(true)}
          onOpenProject={() => setOpenProjectOpen(true)}
          // The name is a committed edit like any other, undone by key (plan/phase-09-plan.md, decision 13).
          onRename={(name) => project.getState().commit((document) => withName(document, name))}
          onSaveACopy={() => void downloads.getState().download("project-file")}
          designs={designs}
          onOpenDesign={(id) => void openFromTheSwitcher(id, { openFromDevice: (one) => saving.getState().openFromDevice(one), say })}
        />
        <div data-workspace-frame className="relative flex min-h-0 grow flex-col overflow-y-auto">{children}</div>
        <TabBar current={workspace} lens={lens} />
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
    </NotesContext.Provider>
  );
}

/** What the three workspaces share: one design, the top bar, the navigation, the notes. */
export function Shell({ children }: { children: ReactNode }) {
  return <Frame>{children}</Frame>;
}
