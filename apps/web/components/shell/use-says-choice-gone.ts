"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { choiceGoneWords } from "@/lib/flow/choice-gone";
import { pathOfLens } from "@/lib/routes";
import { useStores } from "./stores";

export const UNDO = "Undo";

/** The label of the note's action: the options of the Strings lens, where another can be chosen. */
export const CHOOSE_ANOTHER = "Choose another";

/**
 * A choice of stringing an edit took away is said in a note of one line, with Undo and the way to the options (the board
 * "V2 · 5 · Problems"). It is said once, when the shell is there to say it.
 */
export function useSaysChoiceGone() {
  const { choicesGone, toasts, project } = useStores();
  const router = useRouter();

  useEffect(() => {
    function tell() {
      const gone = choicesGone.getState().take();
      if (gone === null) return;
      // Undo takes the edit back that took the choice away; Choose another leads to the options.
      void toasts.show({
        kind: "note",
        words: choiceGoneWords(gone),
        action: { label: UNDO, run: () => project.getState().undo() },
        alsoAction: { label: CHOOSE_ANOTHER, run: () => router.push(pathOfLens("strings")) },
      });
    }
    tell();
    return choicesGone.subscribe((state) => {
      if (state.waiting !== null) tell();
    });
  }, [choicesGone, toasts, project, router]);
}
