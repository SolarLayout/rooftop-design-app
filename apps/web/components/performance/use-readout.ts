"use client";

import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { TOOLTIP_DELAY, TOOLTIP_GAP } from "@/components/ui/design-numbers";
import { placeOf, type Place } from "@/components/ui/place-floating";

export type ReadoutTarget = {
  ref: RefObject<HTMLDivElement | null>;
  onPointerEnter: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onFocus: (event: FocusEvent<HTMLDivElement>) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export type Readout = {
  target: ReadoutTarget;
  /** The bubble: a popover of the browser. */
  bubble: RefObject<HTMLDivElement | null>;
  /** Where the bubble stands, in pixels of the screen; null while it is not shown. */
  place: Place | null;
};

/**
 * A readout over the middle of a row (plan/phase-08-plan.md, decision 18; components.md, "Loss chain"): it comes a
 * moment after the pointer came over the row, at once with the keyboard focus inside it, and on a tap beside the
 * row's controls; it goes with the pointer or the focus leaving, with Escape, and with another tap. It is a
 * popover of the browser, in the top layer, measured where it is not seen and then placed.
 */
export function useReadout(): Readout {
  const row = useRef<HTMLDivElement | null>(null);
  const bubble = useRef<HTMLDivElement | null>(null);
  const waiting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [place, setPlace] = useState<Place | null>(null);

  function stopWaiting() {
    if (waiting.current !== null) clearTimeout(waiting.current);
    waiting.current = null;
  }

  function show() {
    stopWaiting();
    const [anchor, floating] = [row.current, bubble.current];
    if (!anchor || !floating) return;
    if (!floating.matches(":popover-open")) floating.showPopover();
    setPlace(
      placeOf({
        anchor: anchor.getBoundingClientRect(),
        size: floating.getBoundingClientRect(),
        screen: { width: window.innerWidth, height: window.innerHeight },
        side: "above",
        align: "middle",
        gap: TOOLTIP_GAP,
      }),
    );
  }

  function hide() {
    stopWaiting();
    if (bubble.current?.matches(":popover-open")) bubble.current.hidePopover();
    setPlace(null);
  }

  useEffect(() => stopWaiting, []);

  const target: ReadoutTarget = {
    ref: row,
    onPointerEnter(event) {
      if (event.pointerType !== "mouse") return;
      stopWaiting();
      waiting.current = setTimeout(show, TOOLTIP_DELAY);
    },
    onPointerLeave: hide,
    onPointerUp(event) {
      // A tap on the row shows it, and another takes it away; a tap on the row's field or switch is theirs.
      if (event.pointerType === "mouse") return;
      if (event.target instanceof Element && event.target.closest("input, button")) return;
      if (place === null) show();
      else hide();
    },
    onFocus(event) {
      if (event.target.matches(":focus-visible")) show();
    },
    onBlur: hide,
    onKeyDown(event) {
      if (event.key === "Escape") hide();
    },
  };
  return { target, bubble, place };
}
