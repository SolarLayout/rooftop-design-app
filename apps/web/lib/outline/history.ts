// Undo, redo and clear of what is drawn: a list of states, of which one is the present.

export type History<T> = { past: readonly T[]; present: T; future: readonly T[] };

export function historyOf<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export const canUndo = <T>(history: History<T>) => history.past.length > 0;
export const canRedo = <T>(history: History<T>) => history.future.length > 0;

/** The history with `next` as its present. The same present is no step. */
export function withNext<T>(history: History<T>, next: T): History<T> {
  if (next === history.present) return history;
  return { past: [...history.past, history.present], present: next, future: [] };
}

export function undone<T>(history: History<T>): History<T> {
  if (!canUndo(history)) return history;
  const past = history.past.slice(0, -1);
  return { past, present: history.past[history.past.length - 1], future: [history.present, ...history.future] };
}

export function redone<T>(history: History<T>): History<T> {
  if (!canRedo(history)) return history;
  const [present, ...future] = history.future;
  return { past: [...history.past, history.present], present, future };
}

/** Clear is a step: the empty state becomes the present and what was drawn can come back. */
export function cleared<T>(history: History<T>, empty: T): History<T> {
  return withNext(history, empty);
}
