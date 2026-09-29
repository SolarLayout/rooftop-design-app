"use client";

import { useRef, type PointerEvent } from "react";
import { classNames } from "./class-names";

type Props = {
  /** A press on the handle, or a drag of it downwards. */
  onClose: () => void;
  className?: string;
};

/**
 * The handle of a bottom sheet that opens over the screen: 40 by 4. A press on it, or a drag of it
 * downwards, closes the sheet. The sheet of the inspector, which has stops, has a handle of its own.
 */
export function SheetGrip({ onClose, className }: Props) {
  const pressedAt = useRef<number | null>(null);

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const from = pressedAt.current;
    pressedAt.current = null;
    if (from !== null && event.clientY >= from) onClose();
  }

  return (
    <button
      type="button"
      aria-label="Close"
      className={classNames("relative flex h-4 w-full shrink-0 cursor-pointer touch-none justify-center pt-2 focus-ring", className)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pressedAt.current = event.clientY;
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pressedAt.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClose();
      }}
    >
      {/* What takes the pointer is higher than what is seen. */}
      <span className="absolute inset-x-0 top-0 h-touch" />
      <span data-testid="grip" className="h-1 w-10 rounded-full bg-line-strong" />
    </button>
  );
}
