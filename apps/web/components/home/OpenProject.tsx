"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useStores } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FileDrop, type FileDropState } from "@/components/ui/FileDrop";
import { Icon } from "@/components/ui/Icon";
import { api, type OpenedProject } from "@/lib/api";
import { isProjectFile, linesOf, NOT_A_PROJECT_FILE, refusalOf, requestOf } from "@/lib/home/open-project";
import { pathOfLens } from "@/lib/routes";
import { lensOf } from "@/lib/stores/view-store";

type Props = { open: boolean; onClose: () => void };

export const OPEN_A_PROJECT = "Open a project";
const WHAT_IT_IS = "A project saved by this app or the desktop app. It opens in the Studio and runs again here.";

/** What the dialog holds of the file chosen last: the file, and what the API answered for it once it has. */
type Chosen = { file: File; opened: OpenedProject | null };

/**
 * Open a project (plan/phase-10-plan.md, step 9, decision 4; the board "Open a project"): an .rtd is read as soon as it
 * is dropped or chosen, by the browser as text and by the API with the engine's own reader. What was read stands in the
 * field (the file's name, the project's name, that the capacity and the energy come with the run) and under it as rows,
 * word for word, the engine's notes on the files a format 1 project names without their text. Open keeps the project on
 * this device as a new design and opens it in the Studio at its last lens, with no second request. A file the API refuses
 * is refused in the field in the API's words; an API that was not reached offers Try again, which reads the file again.
 * A file that is no .rtd is refused in the dialog's own words, without a request. A second file chosen replaces the
 * first: an answer for a file no longer chosen changes nothing. Opened from the project switcher on every workspace, and
 * from Home.
 */
export function OpenProject({ open, onClose }: Props) {
  const router = useRouter();
  const { saving, view } = useStores();
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [state, setState] = useState<FileDropState>({ kind: "rest" });
  const [canTryAgain, setCanTryAgain] = useState(false);
  // The file chosen last: an answer for another, or for a dialog closed meanwhile, changes nothing.
  const current = useRef<File | null>(null);
  const read = chosen?.opened ?? null;
  const waits = read === null;

  async function readTheFile(file: File) {
    current.current = file;
    setChosen({ file, opened: null });
    setCanTryAgain(false);
    setState({ kind: "reading", file: file.name });
    try {
      const opened = await api.openProject(await requestOf(file));
      if (current.current !== file) return;
      setChosen({ file, opened });
      setState({ kind: "read", file: file.name, lines: linesOf(opened) });
    } catch (error) {
      if (current.current !== file) return;
      const refusal = refusalOf(error);
      setState({ kind: "refused", reason: refusal.words });
      setCanTryAgain(refusal.canTryAgain);
    }
  }

  function hold(file: File) {
    if (!isProjectFile(file.name)) {
      current.current = null;
      setChosen(null);
      setCanTryAgain(false);
      setState({ kind: "refused", reason: NOT_A_PROJECT_FILE });
      return;
    }
    void readTheFile(file);
  }

  function close() {
    current.current = null;
    setChosen(null);
    setCanTryAgain(false);
    setState({ kind: "rest" });
    onClose();
  }

  function openTheProject() {
    if (read === null) return;
    saving.getState().keepAndOpen(read.project);
    close();
    router.push(pathOfLens(lensOf(view.getState())));
  }

  return (
    <Dialog
      open={open}
      title={OPEN_A_PROJECT}
      onClose={close}
      actions={[
        { label: "Cancel", kind: "quiet", onPress: close },
        { label: "Open", kind: "primary", waits, onPress: openTheProject },
      ]}
    >
      <p>{WHAT_IT_IS}</p>
      <div className="mt-3 flex flex-col gap-3">
        <FileDrop title="Drop the project file here" detail="An .rtd file saved by this app or the desktop app" whenOver="It is read, and opens as a new design on this device" accept=".rtd" state={state} onFile={hold} />
        {canTryAgain && chosen ? (
          <div className="flex justify-end">
            <Button size="s" onClick={() => void readTheFile(chosen.file)}>
              Try again
            </Button>
          </div>
        ) : null}
        {read && read.notes.length > 0 ? (
          <div role="status">
            <ul aria-label="Notes on the file" className="flex flex-col gap-2">
              {read.notes.map((note) => (
                <li key={note} data-testid="open-note" className="flex items-start gap-2.5 rounded-item border border-note-line bg-note-surface px-3 py-2.5 type-small">
                  <Icon name="note" size={16} label="Note" className="mt-0.5 shrink-0 text-accent" />
                  <span className="min-w-0">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
