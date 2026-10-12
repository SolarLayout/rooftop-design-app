"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";

// The parts a how-to's picture and its clip share (components.md, "How-to steps and pictures"): the numbered mark, the
// callouts over the picture and their words under it, the frame, and a media query followed as it changes.

/**
 * A numbered mark of the accent, in the light of the ? disc. Its line is the digit's own height (leading-none): the label's
 * line of 20 is taller than a mark of 16 or 20, and set the digit low in it.
 */
export const MARK = "grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-ink tabular-nums shadow-primary type-unit leading-none";

export type MarkProps = { n: number; x: number; y: number; ring?: boolean; children: ReactNode };

/** The callouts over a picture, at their places: they scale with it. */
export function MarksOver({ marks }: { marks: readonly MarkProps[] }) {
  return marks.map(({ n, x, y, ring }) => (
    // The place is the topic's, in per cent of the picture: data, not a size of the design.
    <span key={n} aria-hidden="true" className="absolute left-at top-down" style={measures({ at: x / 100, down: y / 100 })}>
      {ring ? <span className="absolute size-10 -translate-1/2 rounded-full border-help-ring border-accent shadow-help-ring" /> : null}
      <span className={classNames(MARK, "absolute size-5", ring ? "translate-x-2 translate-y-2" : "-translate-1/2")}>{n}</span>
    </span>
  ));
}

/** The callouts' words, by their numbers. */
export function MarkWords({ marks }: { marks: readonly MarkProps[] }) {
  return (
    <ol className="flex flex-col gap-1">
      {marks.map(({ n, children: words }) => (
        <li key={n} className="flex items-start gap-2 type-body-touch desktop:type-body text-text-2">
          <span aria-hidden="true" className={classNames(MARK, "mt-0.5 size-4")}>
            {n}
          </span>
          <span>{words}</span>
        </li>
      ))}
    </ol>
  );
}

export const FRAME = "relative block w-full overflow-hidden rounded-row border border-line bg-surface-2";

function subscribed(query: string) {
  return (changed: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", changed);
    return () => list.removeEventListener("change", changed);
  };
}

/** Whether a media query matches: read on the client, false where there is no window, and followed as it changes. */
export function useMatches(query: string): boolean {
  const subscribe = useMemo(() => subscribed(query), [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
