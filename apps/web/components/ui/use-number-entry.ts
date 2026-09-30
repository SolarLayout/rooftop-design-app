"use client";

import { useState, type ChangeEvent, type FocusEvent, type KeyboardEvent } from "react";
import { committed, numberOf, saidOf, shown, stepped, type Range } from "./number-entry";

type Entry = {
  /** What the input shows: the draft while there is one, the value otherwise. */
  text: string;
  /** What the field says after it changed an entry; null when it has nothing to say. */
  said: string | null;
  /** Commits another value at once, as the buttons of a stepper do. */
  commit: (value: number) => void;
  input: {
    onFocus: (event: FocusEvent<HTMLInputElement>) => void;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  };
};

/**
 * Draft, then commit. What is typed is a draft and changes nothing. Enter or leaving the field commits
 * it; Escape gives it up. The arrows step the draft. `onCommit` hears a value only when it is another
 * than before. A field that has no value yet (`value` null) is empty and says nothing until a number
 * is typed into it.
 */
export function useNumberEntry(value: number | null, range: Range, unit: string | undefined, onCommit: (value: number) => void): Entry {
  const [draft, setDraft] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  function commit(next: number) {
    setDraft(null);
    setSaid(null);
    if (next !== value) onCommit(next);
  }

  function commitDraft() {
    if (draft === null) return;
    setDraft(null);
    if (value === null) {
      // Nothing yet: an empty draft leaves it so, and says nothing; what is no number says what can be entered.
      const typed = numberOf(draft);
      if (draft.trim() === "") return setSaid(null);
      if (typed === null) return setSaid(saidOf("not-a-number", range, unit));
      const result = committed(draft, typed, range);
      setSaid(saidOf(result.correction, range, unit));
      return onCommit(result.value);
    }
    const result = committed(draft, value, range);
    setSaid(saidOf(result.correction, range, unit));
    if (result.value !== value) onCommit(result.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") commitDraft();
    if (event.key === "Escape") setDraft(null);
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const from = numberOf(draft ?? "") ?? value ?? range.min ?? 0;
      setDraft(shown(stepped(from, event.key === "ArrowUp" ? "up" : "down", range), range.decimals));
    }
  }

  return {
    text: draft ?? (value === null ? "" : shown(value, range.decimals)),
    said,
    commit,
    input: {
      onFocus: (event) => event.target.select(),
      onChange: (event) => setDraft(event.target.value),
      onBlur: commitDraft,
      onKeyDown,
    },
  };
}
