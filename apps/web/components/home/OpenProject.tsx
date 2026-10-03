"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStores, useToasts } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FileDrop, type FileDropState } from "@/components/ui/FileDrop";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { heldWordsOf, isProjectFile, NOT_A_PROJECT_FILE, openProjectFile, refusalOf, requestOf, type Refusal } from "@/lib/home/open-project";
import { pathOfLens } from "@/lib/routes";
import { lensOf } from "@/lib/stores/view-store";

type Props = { open: boolean; onClose: () => void };

export const OPEN_A_PROJECT = "Open a project";
const WHAT_IT_IS = "A project saved by this app or the desktop app. It opens in the Studio and runs again here.";
const NOT_LOADED = "This file was not loaded";

/**
 * Open a project (plan/phase-10-plan.md, step 9, decision 4; the board "Open a project"): an .rtd is held until Open,
 * then read by the browser as text and sent to the API, where the engine's own reader reads it. The project it answers
 * is kept on this device as a new design and opened in the Studio at its last lens; each note of the API (a file of a
 * format 1 project to choose again) is a toast in its words. A file the API refuses stays chosen, and the refusal stands
 * under the field in the API's words; an API that was not reached offers Try again. A file that is no .rtd is refused
 * in the field, in the dialog's own words, without a request. Opened from the project switcher on every workspace, and
 * from Home.
 */
export function OpenProject({ open, onClose }: Props) {
  const router = useRouter();
  const { saving, view } = useStores();
  const toasts = useToasts();
  const [held, setHeld] = useState<File | null>(null);
  const [state, setState] = useState<FileDropState>({ kind: "rest" });
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const isReading = state.kind === "reading";
  // Open waits for a file, and after the API refused one: the same file would be refused again; another can be chosen.
  const waits = held === null || isReading || (refusal !== null && !refusal.canTryAgain);

  function hold(file: File) {
    setRefusal(null);
    if (!isProjectFile(file.name)) {
      setHeld(null);
      setState({ kind: "refused", reason: NOT_A_PROJECT_FILE });
      return;
    }
    setHeld(file);
    setState({ kind: "held", file: file.name, detail: heldWordsOf(file.size) });
  }

  function close() {
    setHeld(null);
    setRefusal(null);
    setState({ kind: "rest" });
    onClose();
  }

  async function openTheProject() {
    if (held === null || waits) return;
    setRefusal(null);
    setState({ kind: "reading", file: held.name });
    try {
      const notes = await openProjectFile(await requestOf(held), { api, keep: (document) => saving.getState().keepAndOpen(document) });
      close();
      router.push(pathOfLens(lensOf(view.getState())));
      // One toast per note, each in the API's words and each closed by hand: the queue shows them one after the other.
      for (const note of notes) toasts.show({ kind: "note", words: note });
    } catch (error) {
      // The file stays chosen, so that another can be chosen, or the same sent again when the API was not reached.
      setState({ kind: "held", file: held.name, detail: heldWordsOf(held.size) });
      setRefusal(refusalOf(error));
    }
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
        <FileDrop title="Drop the project file here" detail="An .rtd file saved by this app or the desktop app" whenOver="It opens as a new design on this device" accept=".rtd" state={state} onFile={hold} />
        {refusal ? (
          <div data-testid="open-refused" role="status" className="flex items-start gap-2.5 rounded-row border border-note-line bg-note-surface px-3 py-2.5">
            <Icon name="note" size={20} label="Note" className="mt-0.5 shrink-0 text-accent" />
            <span className="flex min-w-0 grow flex-col gap-0.5">
              <span className="font-medium text-text">{NOT_LOADED}</span>
              <span className="type-small">{refusal.words}</span>
            </span>
            {refusal.canTryAgain ? (
              <Button size="s" onClick={openTheProject}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
