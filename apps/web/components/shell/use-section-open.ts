"use client";

// A section of the work column open or closed (V2 · 3): as the user left it on this device; one never touched opens as
// its step says. Read with useSyncExternalStore, so that every row of the same section agrees at once.
import { useCallback, useSyncExternalStore } from "react";
import { isSectionOpenOf, rememberSectionOpen, sectionsOpenOf } from "@/lib/device/progression";

const listeners = new Set<() => void>();
const NONE: Readonly<Record<string, boolean>> = {};
let last: { key: string | null; open: Readonly<Record<string, boolean>> } = { key: null, open: NONE };

const storageOrNull = () => (typeof window === "undefined" ? null : window.localStorage);

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The same object while the device's record is the same, as useSyncExternalStore asks. */
function snapshot(): Readonly<Record<string, boolean>> {
  const storage = storageOrNull();
  if (storage === null) return NONE;
  const open = sectionsOpenOf(storage);
  const key = JSON.stringify(open);
  if (key !== last.key) last = { key, open };
  return last.open;
}

export function useSectionOpen(id: string, opensFirst: boolean): [boolean, (open: boolean) => void] {
  const open = useSyncExternalStore(subscribe, snapshot, () => NONE);
  const setOpen = useCallback(
    (isOpen: boolean) => {
      const storage = storageOrNull();
      if (storage !== null) rememberSectionOpen(storage, id, isOpen);
      for (const listener of listeners) listener();
    },
    [id],
  );
  return [isSectionOpenOf(open, id, opensFirst), setOpen];
}
