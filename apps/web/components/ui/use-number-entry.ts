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
 * than before.
 */
export function useNumberEntry(value: number, range: Range, unit: string | undefined, onCommit: (value: number) => void): Entry {
  const [draft, setDraft] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  function commit(next: number) {
    setDraft(null);
    setSaid(null);
    if (next !== value) onCommit(next);
  }

  function commitDraft() {
    if (draft === null) return;
    const result = committed(draft, value, range);
    setDraft(null);
    setSaid(saidOf(result.correction, range, unit));
    if (result.value !== value) onCommit(result.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") commitDraft();
    if (event.key === "Escape") setDraft(null);
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const from = numberOf(draft ?? "") ?? value;
      setDraft(shown(stepped(from, event.key === "ArrowUp" ? "up" : "down", range), range.decimals));
    }
  }

  return {
    text: draft ?? shown(value, range.decimals),
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
