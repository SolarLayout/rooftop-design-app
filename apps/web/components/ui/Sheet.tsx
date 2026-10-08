"use client";

import { useId, type ReactNode } from "react";
import { classNames } from "./class-names";
import { measures } from "./measures";
import { valueOf, wordsOf, type Stop } from "./sheet-stops";
import { useSheetDrag } from "./use-sheet-drag";

type Props = {
  /** What the sheet holds, in words. It is the name of the sheet and of its handle. */
  label: string;
  stop: Stop;
  onStop: (stop: Stop) => void;
  /** The share of the room the sheet takes at half, from 0 to 1; half the room when it is not given. */
  half?: number;
  children: ReactNode;
  className?: string;
};

const HEIGHT: Record<Stop, string> = {
  peek: "h-sheet-peek",
  half: "h-1/2 min-h-sheet-peek",
  full: "h-full",
};

/**
 * The bottom sheet of the phone. It stands at the bottom of the room it is put into, which is the
 * nearest element that is placed (`relative`), and has three stops: peek, half the room (or the share
 * given), all of it.
 */
export function Sheet({ label, stop, onStop, half, children, className }: Props) {
  const content = useId();
  const drag = useSheetDrag(stop, onStop, half);
  const isDragged = drag.share !== null;
  const span = drag.share ?? (stop === "half" ? half : undefined);

  return (
    <section
      data-sheet
      aria-label={label}
      className={classNames(
        "absolute inset-x-0 bottom-0 z-sheet flex max-h-full flex-col rounded-t-panel border-t border-line bg-chrome",
        isDragged ? "h-span" : classNames("sheet-motion", span === undefined ? HEIGHT[stop] : "h-span min-h-sheet-peek"),
        className,
      )}
      style={measures(span === undefined ? {} : { span })}
    >
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-controls={content}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valueOf(stop)}
        aria-valuetext={wordsOf(stop)}
        className={classNames(
          "relative flex shrink-0 touch-none justify-center rounded-t-panel pt-2 pb-1 select-none focus-ring",
          isDragged ? "cursor-grabbing" : "cursor-grab",
        )}
        {...drag.handle}
      >
        {/* What takes the pointer is higher than what is seen, and reaches over the edge of the sheet. */}
        <span data-testid="grip-target" className="absolute inset-x-0 -top-5 h-touch" />
        <span data-testid="grip" className="h-1 w-10 rounded-full bg-line-strong" />
      </div>
      {/* The keyboard stops at what scrolls, so that it can be scrolled without a pointer. */}
      <div
        id={content}
        data-testid="sheet-content"
        tabIndex={0}
        className="min-h-0 grow overflow-y-auto overscroll-contain focus-ring"
      >
        {children}
      </div>
    </section>
  );
}
