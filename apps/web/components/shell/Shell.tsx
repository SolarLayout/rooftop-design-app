"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { openWhatBelongs } from "@/lib/device/opening";
import { rememberedOf } from "@/lib/device/remembered";
import { savingOf } from "@/lib/device/saving";
import { placeInShort } from "@/lib/format/place";
import { withName } from "@/lib/flow/name-field";
import { workspaceOf } from "@/lib/routes";
import { latitudeOf, longitudeOf, nameOf, projectOf } from "@/lib/stores/project-store";
import { lensOf } from "@/lib/stores/view-store";
import { Toaster } from "@/components/ui/Toaster";
import { ImportDrawing } from "./ImportDrawing";
import { NotesDrawer } from "./NotesDrawer";
import type { Note } from "./notes-view";
import { useNotes, useProject, useSaving, useStores, useToasts, useView } from "./stores";
import { TopBar } from "./TopBar";
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
  const name = useProject(nameOf);
  const savingState = useSaving(savingOf);
  const latitude = useProject(latitudeOf);
  const longitude = useProject(longitudeOf);
  const lens = useView(lensOf);
  const notes = useNotes();
  const toasts = useToasts();
  const [areNotesOpen, setNotesOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);

  // A workspace without a design opens the design remembered as open, from the device, else the demo (decision 2 of
  // plan/phase-10-plan.md); the flow runs what is opened. A kept design that cannot be read opens the demo and says so.
  useEffect(() => {
    if (projectOf(project.getState()) !== null) return;
    void openWhatBelongs({
      remembered: rememberedOf(window.localStorage),
      openFromDevice: (id) => saving.getState().openFromDevice(id),
      openDemo: flow.openDemo,
      say: (words) => void toasts.show({ kind: "note", words }),
    });
  }, [flow, project, saving, toasts]);

  const place = latitude === null || longitude === null ? null : placeInShort(latitude, longitude);
  const ofTheShell = useMemo(() => ({ notes, open: () => setNotesOpen(true) }), [notes]);

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
          // The name is a committed edit like any other, undone by key (plan/phase-09-plan.md, decision 13).
          onRename={(name) => project.getState().commit((document) => withName(document, name))}
          onSaveACopy={() => void downloads.getState().download("project-file")}
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
      {/* What the app says, in the page from the start: a download that failed (plan/phase-09-plan.md, decision 12). */}
      <Toaster toasts={toasts} aboveTheTabBar />
    </NotesContext.Provider>
  );
}

/** What the three workspaces share: one design, the top bar, the navigation, the notes. */
export function Shell({ children }: { children: ReactNode }) {
  return <Frame>{children}</Frame>;
}
