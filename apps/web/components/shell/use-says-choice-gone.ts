"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { choiceGoneWords } from "@/lib/flow/choice-gone";
import { pathOfLens } from "@/lib/routes";
import { useStores } from "./stores";

/** The label of the note's action: the options of the Strings lens, where another can be chosen. */
export const CHOOSE_ANOTHER = "Choose another";

/**
 * A choice of stringing an edit took away is said in a note, in plain words, with the way to the options (the boards
 * "UI fixes · A choice of stringing that no longer fits"). It is said once, when the shell is there to say it.
 */
export function useSaysChoiceGone() {
  const { choicesGone, toasts } = useStores();
  const router = useRouter();

  useEffect(() => {
    function tell() {
      const gone = choicesGone.getState().take();
      if (gone === null) return;
      void toasts.show({ kind: "note", words: choiceGoneWords(gone), action: { label: CHOOSE_ANOTHER, run: () => router.push(pathOfLens("strings")) } });
    }
    tell();
    return choicesGone.subscribe((state) => {
      if (state.waiting !== null) tell();
    });
  }, [choicesGone, toasts, router]);
}
