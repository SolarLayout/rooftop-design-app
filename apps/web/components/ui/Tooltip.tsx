"use client";

import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { classNames } from "./class-names";
import { TOOLTIP_DELAY, TOOLTIP_GAP } from "./design-numbers";
import { measures } from "./measures";
import { placeOf, type Place } from "./place-floating";

/** Keys that do something to the control, with what they do: ", ." an hour. */
export type Shortcuts = readonly { keys: readonly string[]; words: string }[];

type BubbleProps = {
  /** A key that does the same as the control, as "F". */
  shortcut?: string;
  /** Several keys and what each does, after the words (the timeline of the sun). */
  shortcuts?: Shortcuts;
  children: ReactNode;
};

const KEY = "rounded-key border border-line-strong px-1.25 type-tick text-text-2";

const BUBBLE = classNames(
  "flex h-7 w-max items-center gap-2 rounded-item border border-line-strong bg-control-active px-2.5",
  "type-caption whitespace-nowrap text-text shadow-tooltip",
);

/** The look of a tooltip: its words, and the key that may follow them. */
export function TooltipBubble({ shortcut, shortcuts, children }: BubbleProps) {
  return (
    <>
      {children}
      {shortcut ? <kbd className={KEY}>{shortcut}</kbd> : null}
      {shortcuts?.map(({ keys, words }) => (
        <span key={words} className="flex items-center gap-1.25">
          {keys.map((key) => (
            <kbd key={key} className={KEY}>
              {key}
            </kbd>
          ))}
          <span>{words}</span>
        </span>
      ))}
    </>
  );
}

type Props = {
  /** What the control does, in a few words. It is never the only place where that is said. */
  words: string;
  shortcut?: string;
  shortcuts?: Shortcuts;
  /** How the control's wrapper stands in its row: `grow` where the control is a track that takes the room. */
  className?: string;
  /** The control: one element. It is described by the tooltip and keeps its own name. */
  children: ReactElement<{ "aria-describedby"?: string }>;
};

/**
 * The name of a control that shows an icon or one word. It comes a moment after the pointer came and at
 * once with the keyboard focus, never on touch; it is over its control, in the top layer of the browser.
 */
export function Tooltip({ words, shortcut, shortcuts, className, children }: Props) {
  const id = useId();
  const control = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const waiting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [place, setPlace] = useState<Place | null>(null);

  function stopWaiting() {
    if (waiting.current !== null) clearTimeout(waiting.current);
    waiting.current = null;
  }

  function show() {
    stopWaiting();
    const [anchor, floating] = [control.current?.firstElementChild, bubble.current];
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

  return (
    <span
      ref={control}
      className={classNames("inline-flex", className)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        stopWaiting();
        waiting.current = setTimeout(show, TOOLTIP_DELAY);
      }}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) show();
      }}
      onBlur={hide}
      onKeyDown={(event) => {
        if (event.key === "Escape") hide();
      }}
    >
      {cloneElement(children, { "aria-describedby": id })}
      <span
        ref={bubble}
        id={id}
        role="tooltip"
        popover="manual"
        // It is measured where it is not seen, then shown at its place.
        className={classNames(BUBBLE, "pointer-events-none placed", place === null && "invisible")}
        style={measures(place === null ? {} : { x: place.x, y: place.y })}
      >
        <TooltipBubble shortcut={shortcut} shortcuts={shortcuts}>
          {words}
        </TooltipBubble>
      </span>
    </span>
  );
}

/** A tooltip as it looks, without a control: for the kit, where it stands over an example of one. */
export function TooltipShown({ shortcut, children }: BubbleProps) {
  return (
    <span role="tooltip" className={BUBBLE}>
      <TooltipBubble shortcut={shortcut}>{children}</TooltipBubble>
    </span>
  );
}
