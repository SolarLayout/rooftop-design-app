// The queue of toasts: a store without React. One toast is shown at a time, in the order they came. A
// toast of something done leaves by itself; one with a note stays until it is closed (Toaster).

import { CLOCK_OF_THE_BROWSER, type Clock } from "../../lib/clock";
import { TOAST_STAYS } from "./design-numbers";

export type ToastKind = "done" | "note";

export type ToastAsked = {
  kind: ToastKind;
  words: string;
  /** What can be done about it, as "Undo". */
  action?: { label: string; run: () => void };
};

export type Toast = ToastAsked & { id: number };

export type Toasts = ReturnType<typeof createToasts>;

export function createToasts(clock: Clock = CLOCK_OF_THE_BROWSER) {
  let queue: Toast[] = [];
  let lastId = 0;
  // How often the toast that is shown is held: by the pointer over it, by the focus inside it.
  let holds = 0;
  let giveUpWaiting: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const first = () => queue[0] ?? null;

  function wait() {
    giveUpWaiting?.();
    giveUpWaiting = null;
    const toast = first();
    if (toast === null || toast.kind !== "done" || holds > 0) return;
    giveUpWaiting = clock.after(TOAST_STAYS, () => close(toast.id));
  }

  function changed(before: Toast | null) {
    // A toast has its time from when it is shown, and nobody holds one that was not seen yet.
    if (first() !== before) {
      holds = 0;
      wait();
    }
    listeners.forEach((listener) => listener());
  }

  function show(asked: ToastAsked): number {
    const before = first();
    lastId += 1;
    queue = [...queue, { ...asked, id: lastId }];
    changed(before);
    return lastId;
  }

  function close(id: number) {
    if (!queue.some((toast) => toast.id === id)) return;
    const before = first();
    queue = queue.filter((toast) => toast.id !== id);
    changed(before);
  }

  function hold(id: number) {
    if (first()?.id !== id) return;
    holds += 1;
    wait();
  }

  function release(id: number) {
    if (first()?.id !== id || holds === 0) return;
    holds -= 1;
    wait();
  }

  return {
    /** Says something. What comes back names the toast, to close it. */
    show,
    close,
    /** The toast stays while it is held. */
    hold,
    /** Let go by all that held it, a toast of something done has its time again. */
    release,
    /** The toast that is shown now, or null. */
    shown: first,
    /** Hears every change. What comes back stops the listening. */
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
