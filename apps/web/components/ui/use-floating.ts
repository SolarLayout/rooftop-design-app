"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { measures } from "./measures";
import { placeOf, type Side } from "./place-floating";

type Options = {
  /** The side of the control that the panel is on when there is room. */
  side: Side;
  align: "start" | "middle" | "end";
  /** What stays between the control and the panel. */
  gap: number;
};

export type Floating = {
  isOpen: boolean;
  /** Opens the panel beside the control. It is called from a press or a key. */
  open: () => void;
  close: () => void;
  /** Closes the panel and gives the focus back to the control that opened it. */
  closeAndGoBack: () => void;
  /** For the panel, which is a popover of the browser. */
  panel: {
    ref: (element: HTMLDivElement | null) => void;
    popover: "auto";
    style: ReturnType<typeof measures>;
    onToggle: (event: SyntheticEvent<HTMLDivElement>) => void;
  };
};

/**
 * A panel that floats beside the control that opens it, in the top layer of the browser. The browser
 * closes it on Escape and on a press beside it, and gives the focus back; the page being scrolled or
 * the window changing its size closes it too, because its place would no longer be true.
 */
export function useFloating({ side, align, gap }: Options): [floating: Floating, anchor: (element: HTMLElement | null) => void] {
  const anchor = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const [place, setPlace] = useState<{ x: number; y: number } | null>(null);
  const isOpen = place !== null;

  function open() {
    const [control, floating] = [anchor.current, panel.current];
    if (!control || !floating) return;
    if (!floating.matches(":popover-open")) floating.showPopover();
    const { x, y } = placeOf({
      anchor: control.getBoundingClientRect(),
      size: { width: floating.offsetWidth, height: floating.offsetHeight },
      screen: { width: window.innerWidth, height: window.innerHeight },
      side,
      align,
      gap,
    });
    setPlace({ x, y });
  }

  function close() {
    if (panel.current?.matches(":popover-open")) panel.current.hidePopover();
  }

  useEffect(() => {
    if (!isOpen) return;
    // What scrolls inside the panel itself does not move the panel.
    const onScroll = (event: Event) => {
      if (!(event.target instanceof Node && panel.current?.contains(event.target))) close();
    };
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen]);

  const floating: Floating = {
    isOpen,
    open,
    close,
    closeAndGoBack() {
      close();
      anchor.current?.focus();
    },
    panel: {
      ref(element) {
        panel.current = element;
      },
      popover: "auto",
      style: measures(place ?? {}),
      // The browser says when the panel went, whoever closed it.
      onToggle(event) {
        if ("newState" in event.nativeEvent && event.nativeEvent.newState === "closed") setPlace(null);
      },
    },
  };
  // The control that opens the panel says which element it is, as the `ref` of that element.
  return [
    floating,
    (element) => {
      anchor.current = element;
    },
  ];
}
