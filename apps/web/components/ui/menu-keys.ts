import type { KeyboardEvent } from "react";
import { indexAfterKey } from "./list-keys";

const MOVING_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);

/**
 * The keys of a `menu` (the project switcher's, a card's): the arrows go through the rows of the menu the key was pressed
 * in, Home and End to its ends; a key that leads nowhere scrolls nothing.
 */
export function onMenuKeyDown(event: KeyboardEvent<HTMLUListElement>) {
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
  const current = items.findIndex((item) => item === document.activeElement);
  const to = indexAfterKey(items.length, current === -1 ? null : current, event.key, new Set());
  if (to !== null || MOVING_KEYS.has(event.key)) event.preventDefault();
  if (to !== null) items[to]?.focus();
}
