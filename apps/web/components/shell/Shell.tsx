"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { placeInShort } from "@/lib/format/place";
import { workspaceOf } from "@/lib/routes";
import { latitudeOf, longitudeOf, nameOf, projectOf } from "@/lib/stores/project-store";
import { lensOf } from "@/lib/stores/view-store";
import { Toaster } from "@/components/ui/Toaster";
import { ImportDrawing } from "./ImportDrawing";
import { NotesDrawer } from "./NotesDrawer";
import type { Note } from "./notes-view";
import { useNotes, useProject, useStores, useToasts, useView } from "./stores";
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
  const { flow, project } = useStores();
  const name = useProject(nameOf);
  const latitude = useProject(latitudeOf);
  const longitude = useProject(longitudeOf);
  const lens = useView(lensOf);
  const notes = useNotes();
  const toasts = useToasts();
  const [areNotesOpen, setNotesOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);

  // A workspace without a design opens the demo. From Phase 10 on the designs of the device come first.
  useEffect(() => {
    if (projectOf(project.getState()) === null) flow.openDemo();
  }, [flow, project]);

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
          // Designs are kept on the device from Phase 10 on.
          saving="not-kept"
          notes={notes.length}
          onOpenNotes={ofTheShell.open}
          onImport={() => setImportOpen(true)}
        />
        <div data-workspace-frame className="relative flex min-h-0 grow flex-col overflow-y-auto">{children}</div>
        <TabBar current={workspace} lens={lens} />
      </div>
      <NotesDrawer open={areNotesOpen} notes={notes} onClose={() => setNotesOpen(false)} onTryAgain={flow.tryAgain} />
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
