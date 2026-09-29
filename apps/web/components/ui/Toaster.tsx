"use client";

import { useSyncExternalStore, type FocusEvent } from "react";
import { classNames } from "./class-names";
import { Toast } from "./Toast";
import type { Toasts } from "./toast-queue";

type Props = {
  /** The queue whose toasts are shown here. */
  toasts: Toasts;
  /** What the place is called, for a screen reader. */
  label?: string;
  className?: string;
};

const nothing = () => null;

/** The focus went to, or came from, a place outside the toast. */
const crossesTheEdge = (event: FocusEvent<HTMLDivElement>) =>
  !(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget));

/**
 * Where toasts are shown: at the bottom of the screen, in its middle. It is in the page from the start
 * and empty, so that a screen reader hears what comes into it.
 */
export function Toaster({ toasts, label = "What was done", className }: Props) {
  const toast = useSyncExternalStore(toasts.subscribe, toasts.shown, nothing);

  return (
    <div
      role="status"
      aria-label={label}
      className={classNames("pointer-events-none fixed inset-x-0 bottom-0 z-toast flex justify-center px-4 pb-6", className)}
    >
      {toast ? (
        <Toast
          key={toast.id}
          kind={toast.kind}
          words={toast.words}
          action={
            toast.action && {
              label: toast.action.label,
              onPress: () => {
                toast.action?.run();
                toasts.close(toast.id);
              },
            }
          }
          onClose={toast.kind === "note" ? () => toasts.close(toast.id) : undefined}
          className="pointer-events-auto"
          onPointerEnter={() => toasts.hold(toast.id)}
          onPointerLeave={() => toasts.release(toast.id)}
          onFocus={(event) => crossesTheEdge(event) && toasts.hold(toast.id)}
          onBlur={(event) => crossesTheEdge(event) && toasts.release(toast.id)}
        />
      ) : null}
    </div>
  );
}
