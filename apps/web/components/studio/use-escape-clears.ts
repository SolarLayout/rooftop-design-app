"use client";

import { useEffect } from "react";
import { isKeyHeld, keyTargetOf } from "@/components/shell/keys-held";
import { useStores, useView } from "@/components/shell/stores";
import { draftOf, selectionOf } from "@/lib/stores/view-store";

/**
 * Escape clears what is selected on the roof and drops a draft obstacle (docs/design/components.md,
 * "Obstacles on the roof"). Not from inside a field, where Escape gives up what was typed, nor from an open dialog, which it closes: nothing more.
 */
export function useEscapeClears(): void {
  const { view } = useStores();
  const selection = useView(selectionOf);
  const draft = useView(draftOf);

  useEffect(() => {
    if (!selection && !draft) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isKeyHeld(keyTargetOf(event))) return;
      view.getState().clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, draft, view]);
}
