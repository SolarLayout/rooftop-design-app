"use client";

// The work column shown or hidden on desktop (D99): ⌘ \ (Ctrl \) toggles it; the device remembers it hidden; it is shown
// again on a design's first open, when the step in hand needs the user, and when an object on the roof is selected
// (the view store does the last).
import { useEffect } from "react";
import { isKeyHeld, keyTargetOf } from "@/components/shell/keys-held";
import { useStores } from "@/components/shell/stores";
import { isPanelHiddenOn, rememberPanelHidden } from "@/lib/device/progression";
import { isPanelKey } from "@/lib/studio/panel-key";

const TAKES_ITS_OWN_KEYS = '[role="slider"], [role="menu"], [role="listbox"], [role="combobox"]';

const storageOrNull = () => (typeof window === "undefined" ? null : window.localStorage);

/** `isFirstOpen`: the design was never opened on this device; `needsYou`: the step in hand waits for the user. */
export function usePanel({ isFirstOpen, needsYou }: { isFirstOpen: boolean; needsYou: boolean }): void {
  const { view } = useStores();

  // As the device left it, unless the design is new to it or the step needs the user.
  useEffect(() => {
    const storage = storageOrNull();
    if (storage === null) return;
    view.getState().hidePanel(isPanelHiddenOn(storage) && !isFirstOpen && !needsYou);
  }, [view, isFirstOpen, needsYou]);

  useEffect(() => {
    const storage = storageOrNull();
    return view.subscribe((state, before) => {
      if (storage !== null && state.isPanelHidden !== before.isPanelHidden) rememberPanelHidden(storage, state.isPanelHidden);
    });
  }, [view]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isTyping = isKeyHeld(keyTargetOf(event), TAKES_ITS_OWN_KEYS);
      if (!isPanelKey({ key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey, isTyping })) return;
      event.preventDefault();
      view.getState().hidePanel(!view.getState().isPanelHidden);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view]);
}
