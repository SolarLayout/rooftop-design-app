"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { committedText, type TextRules } from "./text-entry";

type Entry = {
  /** What the input shows: the draft while there is one, the value otherwise. */
  text: string;
  /** What the field says after it refused an entry; null when it has nothing to say. */
  said: string | null;
  input: {
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  };
};

/**
 * Draft, then commit. What is typed is a draft and changes nothing. Enter or leaving the field commits it; Escape gives
 * the value back. `onCommit` hears a value only when it is another than before. `onDraft` hears every change of the
 * draft, and null when the draft is gone, for what follows the words as they are typed. `onDone` hears every commit with
 * what the field says of it, null when the entry stood: for a field that is shown for one entry.
 */
export function useTextEntry(
  value: string,
  rules: TextRules,
  onCommit: (value: string) => void,
  onDraft?: (draft: string | null) => void,
  onDone?: (said: string | null) => void,
): Entry {
  const [draft, setDraft] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  function giveUp() {
    setDraft(null);
    setSaid(null);
    onDraft?.(null);
  }

  function commitDraft() {
    if (draft === null) return;
    const result = committedText(draft, value, rules);
    setDraft(null);
    setSaid(result.said);
    onDraft?.(null);
    if (result.value !== value) onCommit(result.value);
    onDone?.(result.said);
  }

  return {
    text: draft ?? value,
    said,
    input: {
      onChange(event) {
        setDraft(event.target.value);
        onDraft?.(event.target.value);
      },
      onBlur: commitDraft,
      onKeyDown(event) {
        if (event.key === "Enter") commitDraft();
        if (event.key === "Escape") giveUp();
      },
    },
  };
}
