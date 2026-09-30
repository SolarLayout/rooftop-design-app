import { useEffect } from "react";
import type { OutlineEvent } from "@/lib/outline/outline-state";

// The keyboard of the outline: Enter closes, Escape takes the last corner back, the arrows nudge the
// selected corner (a metre with Shift), Delete removes it, Cmd or Ctrl with Z undoes, with Shift redoes.
// Keys typed into a field are the field's.

const NUDGES = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** What a key of the outline means; null for a key that is none of its own. */
export function outlineEventOfKey(event: Pick<KeyboardEvent, "key" | "shiftKey" | "metaKey" | "ctrlKey">): OutlineEvent | null {
  const { key, shiftKey, metaKey, ctrlKey } = event;
  if ((metaKey || ctrlKey) && key.toLowerCase() === "z") return shiftKey ? { type: "redone" } : { type: "undone" };
  if (key === "Enter") return { type: "close" };
  if (key === "Escape") return { type: "steppedBack" };
  if (key === "Delete" || key === "Backspace") return { type: "removed" };
  if (NUDGES.has(key)) return { type: "nudged", key, shift: shiftKey };
  return null;
}

/** Listens to the keys of the outline while `enabled`. */
export function useOutlineKeys(enabled: boolean, on: (event: OutlineEvent) => void): void {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target)) return;
      const outlineEvent = outlineEventOfKey(event);
      if (!outlineEvent) return;
      event.preventDefault();
      on(outlineEvent);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, on]);
}
