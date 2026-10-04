import { useEffect, useState } from "react";
import { useDownloads, useProject, useStores } from "@/components/shell/stores";
import type { ExportedFile, ExportKind } from "@/lib/api";
import { failureOf } from "@/lib/flow/design-flow";
import { keptOf } from "@/lib/stores/downloads-store";
import { editOf } from "@/lib/stores/project-store";

type AskedFile = {
  /** The file of this edit of the document, once it came; null before. */
  file: ExportedFile | null;
  /** Why it did not come, in the API's words; null while it may still come, or came. */
  failure: string | null;
  /** Asks once more after a failure. */
  askAgain: () => void;
};

/**
 * A file of the design asked for while its item is open, once per edit of the document, and kept by the downloads store, so
 * that the download saves the same bytes (plan/phase-09-plan.md, decision 8: the CSV). A refusal is kept here with the
 * API's words, for the body to say with Try again; nothing is said in a toast, since nothing was pressed.
 */
export function useAskedFile(kind: ExportKind, isWanted: boolean): AskedFile {
  const { downloads } = useStores();
  const edit = useProject(editOf);
  const file = useDownloads((state) => keptOf(state, kind, edit));
  const [failed, setFailed] = useState<{ edit: number; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isWanted) return;
    let isOver = false;
    downloads
      .getState()
      .ask(kind)
      .catch((error: unknown) => {
        if (!isOver) setFailed({ edit, message: failureOf(error).message });
      });
    return () => {
      isOver = true;
    };
  }, [downloads, kind, edit, isWanted, attempt]);

  return {
    file,
    failure: failed !== null && failed.edit === edit ? failed.message : null,
    askAgain: () => {
      setFailed(null);
      setAttempt((count) => count + 1);
    },
  };
}
