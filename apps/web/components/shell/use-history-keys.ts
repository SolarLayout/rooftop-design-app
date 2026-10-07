"use client";

import { useEffect } from "react";
import { isKeyHeld, keyTargetOf } from "@/components/shell/keys-held";
import { useStores } from "@/components/shell/stores";

// The keys of the history (plan/phase-05-plan.md, step 18, decision 11): Cmd or Ctrl with Z undoes the last
// committed edit, with Shift redoes it; Ctrl with Y redoes too. Keys typed into a field are the field's: a field's
// own undo works on what is being typed. Keys pressed in an open dialog (the help sheet) are the dialog's. The Studio, Performance and Handover listen; their edits are the same document's.

export type HistoryStep = "undo" | "redo";

/** What a key means for the history; null for a key that is none of its own. */
export function historyOfKey(event: Pick<KeyboardEvent, "key" | "shiftKey" | "metaKey" | "ctrlKey" | "altKey">): HistoryStep | null {
  const { key, shiftKey, metaKey, ctrlKey, altKey } = event;
  if (!(metaKey || ctrlKey) || altKey) return null;
  if (key.toLowerCase() === "z") return shiftKey ? "redo" : "undo";
  if (ctrlKey && key.toLowerCase() === "y") return "redo";
  return null;
}

/** Listens to the keys of the history while the Studio or Performance is shown. */
export function useHistoryKeys(): void {
  const { project } = useStores();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isKeyHeld(keyTargetOf(event))) return;
      const step = historyOfKey(event);
      if (!step) return;
      event.preventDefault();
      if (step === "undo") project.getState().undo();
      else project.getState().redo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [project]);
}
