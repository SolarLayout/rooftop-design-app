"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { limitsOf, moved, nearestHandle, shareAt, valueAfterKey, valueAt, type Scale } from "./slider-steps";

type Slide = {
  /** What is shown: the draft while a handle is moved, the values otherwise. */
  shown: readonly number[];
  /**
   * For the whole slider: a press anywhere on it moves the nearest handle there and begins a drag. The
   * pointer is measured against the rail inside it (`data-rail`): the part of the track that the middle
   * of a handle can be on.
   */
  surface: {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
  /** For each handle. Which one it is, the handle says itself, by `data-handle`. */
  handle: {
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    onKeyUp: (event: KeyboardEvent<HTMLDivElement>) => void;
    onBlur: () => void;
  };
};

type Options = {
  values: readonly number[];
  scale: Scale;
  /** What stays between two handles at least. */
  apart: number;
  /** Hears the values once they are committed, and only when one is another than before. */
  onCommit: (values: number[]) => void;
  disabled: boolean;
};

/**
 * Draft, then commit. A drag or a key changes what is shown; the values are committed when the drag
 * ends, when the key is released, or when the focus leaves. A drag that is broken off is given up.
 */
export function useSlide({ values, scale, apart, onCommit, disabled }: Options): Slide {
  const [draft, setDraft] = useState<number[] | null>(null);
  // Beside the state, so that a key that repeats before the next render goes on from the last draft.
  const latest = useRef<number[] | null>(null);
  const dragged = useRef<number | null>(null);

  function show(next: number[] | null) {
    latest.current = next;
    setDraft(next);
  }

  function commit() {
    const result = latest.current;
    dragged.current = null;
    if (result === null) return;
    show(null);
    if (result.some((value, index) => value !== values[index])) onCommit(result);
  }

  function giveUp() {
    dragged.current = null;
    show(null);
  }

  function shareUnder(event: PointerEvent<HTMLDivElement>): number {
    const box = event.currentTarget.querySelector("[data-rail]")?.getBoundingClientRect();
    return box ? shareAt(event.clientX, box.left, box.width) : 0;
  }

  function moveTo(index: number, share: number) {
    const to = valueAt(share, scale, limitsOf(values, index, scale, apart));
    show(moved(values, index, to, scale, apart));
  }

  const surface: Slide["surface"] = {
    onPointerDown(event) {
      if (disabled || event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const share = shareUnder(event);
      const index = nearestHandle(values, valueAt(share, scale));
      dragged.current = index;
      moveTo(index, share);
      event.currentTarget.querySelectorAll<HTMLElement>('[role="slider"]')[index]?.focus();
    },
    onPointerMove(event) {
      if (dragged.current !== null) moveTo(dragged.current, shareUnder(event));
    },
    onPointerUp: commit,
    onPointerCancel: giveUp,
  };

  const handle: Slide["handle"] = {
    onKeyDown(event) {
      if (disabled) return;
      const index = Number(event.currentTarget.dataset.handle);
      const from = (latest.current ?? values)[index] ?? scale.min;
      const to = valueAfterKey(from, event.key, scale, limitsOf(values, index, scale, apart));
      if (to === null) return;
      event.preventDefault();
      show(moved(values, index, to, scale, apart));
    },
    onKeyUp(event) {
      if (valueAfterKey(scale.min, event.key, scale) !== null) commit();
    },
    // The focus stays on the handle during a drag; it leaves for another reason.
    onBlur() {
      if (dragged.current === null) commit();
    },
  };

  return { shown: draft ?? values, surface, handle };
}
