"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { heightAfterDrag, heightsOf, stopAfterKey, stopAfterRelease, type Heights, type Stop } from "./sheet-stops";

type Drag = { pointerAtStart: number; heightAtStart: number; heights: Heights };

type SheetDrag = {
  /** How much of the room the sheet takes while it is dragged, from 0 to 1; null when it rests at its stop. */
  share: number | null;
  handle: {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  };
};

/** The sheet and the room it stands in, as they are on the screen now. */
function measured(handle: HTMLElement): { height: number; heights: Heights } | null {
  const sheet = handle.closest<HTMLElement>("[data-sheet]");
  const room = sheet?.offsetParent;
  if (!sheet || !room) return null;
  const peek = Number.parseFloat(getComputedStyle(sheet).getPropertyValue("--size-sheet-peek"));
  return { height: sheet.getBoundingClientRect().height, heights: heightsOf(room.clientHeight, peek) };
}

/**
 * The sheet follows a drag of its handle and goes to a stop when it is let go; a key leads to a stop at
 * once. A drag that is broken off leaves the sheet where it was.
 */
export function useSheetDrag(stop: Stop, onStop: (stop: Stop) => void): SheetDrag {
  const [share, setShare] = useState<number | null>(null);
  const drag = useRef<Drag | null>(null);

  function heightUnder(event: PointerEvent<HTMLDivElement>, from: Drag): number {
    return heightAfterDrag(from.heightAtStart, from.pointerAtStart, event.clientY, from.heights);
  }

  function end() {
    drag.current = null;
    setShare(null);
  }

  return {
    share,
    handle: {
      onPointerDown(event) {
        if (event.button !== 0) return;
        const now = measured(event.currentTarget);
        if (!now || now.heights.full === 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
        drag.current = { pointerAtStart: event.clientY, heightAtStart: now.height, heights: now.heights };
      },
      onPointerMove(event) {
        const from = drag.current;
        if (from) setShare(heightUnder(event, from) / from.heights.full);
      },
      onPointerUp(event) {
        const from = drag.current;
        if (!from) return;
        const to = stopAfterRelease(stop, from.heightAtStart, heightUnder(event, from), from.heights);
        end();
        if (to !== stop) onStop(to);
      },
      onPointerCancel: end,
      onKeyDown(event) {
        const to = stopAfterKey(stop, event.key);
        // A key of the sheet that leads nowhere (arrow up when it is open) must not scroll the page either.
        if (to !== null || ["ArrowUp", "ArrowDown", "Home", "End", " "].includes(event.key)) event.preventDefault();
        if (to !== null) onStop(to);
      },
    },
  };
}
