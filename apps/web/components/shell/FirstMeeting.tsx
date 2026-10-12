"use client";

import { useEffect, useSyncExternalStore } from "react";
import { rememberMet, wordsMetOf } from "@/lib/device/progression";
import { lineOf, type ExplainedWord } from "@/lib/words/explain";

// Whether each word was new to the device when this page load first asked: fixed for the load, so the line stays while
// the user reads it, and is not said again on the next one.
const newThisLoad = new Map<ExplainedWord, boolean>();
const storageOrNull = () => (typeof window === "undefined" ? null : window.localStorage);
const nothingToHear = () => () => {};

function isNewToTheDevice(word: ExplainedWord): boolean {
  const known = newThisLoad.get(word);
  if (known !== undefined) return known;
  const storage = storageOrNull();
  const isNew = storage !== null && !wordsMetOf(storage).has(word);
  newThisLoad.set(word, isNew);
  return isNew;
}

/**
 * The app's own word explained in one line under a title, the first time the user meets it on this device (D96): a
 * sentence in secondary text, never a box. Once said, the device remembers it; the ? and the tooltip say it after.
 */
export function FirstMeeting({ word, className }: { word: ExplainedWord; className?: string }) {
  const isNew = useSyncExternalStore(nothingToHear, () => isNewToTheDevice(word), () => false);

  useEffect(() => {
    const storage = storageOrNull();
    if (!isNew || storage === null) return;
    rememberMet(storage, new Set([...wordsMetOf(storage), word]));
  }, [isNew, word]);

  return isNew ? <p className={className ?? "type-body-touch text-text-2 desktop:type-body"}>{lineOf(word)}</p> : null;
}
