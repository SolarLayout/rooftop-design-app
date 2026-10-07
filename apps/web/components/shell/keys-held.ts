// Where a key belongs to what has the focus, not to the page behind it (D80): a field, whose keys edit what is typed,
// and an open dialog (the help sheet, a question asked), whose keys are its own. Escape there closes the dialog and
// nothing more; an undo, an arrow or Delete pressed there never reaches the design behind it.

/** What holds its keys: a field, or an open dialog. */
export const FIELD_OR_DIALOG = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), dialog[open]';

/** What a key is pressed on, as much of a DOM element as is read: the test needs no DOM. */
export type KeyTarget = { closest(selectors: string): unknown };

/** Whether a key pressed on `target` is held there, out of the page's reach; `more` names other places that hold theirs. */
export function isKeyHeld(target: KeyTarget | null, more?: string): boolean {
  if (target === null) return false;
  return target.closest(more ? `${FIELD_OR_DIALOG}, ${more}` : FIELD_OR_DIALOG) !== null;
}

/** What a key event was pressed on; null for the page itself. */
export function keyTargetOf(event: KeyboardEvent): KeyTarget | null {
  return event.target instanceof Element ? event.target : null;
}
