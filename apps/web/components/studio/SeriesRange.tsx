"use client";

import { useId } from "react";
import { withTrueMinus } from "@/components/shell/notes-view";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusMark } from "@/components/ui/StatusMark";
import { seriesBarOf } from "@/lib/studio/series-bar";
import type { Sized } from "@/lib/studio/strings-view";
import { SECTION } from "./inspector-look";

/**
 * Modules in series (docs/design/components.md, "Series range bar"; the boards "Studio, Strings lens" and
 * "Options and your own"): the lengths that fit as a band on the track, their ends with what sets each, the
 * chosen option's length as the marker, and under it the verdict with a tick or a note, in the engine's words.
 * While the run of the voltage chosen is on its way, it waits with a ring; while a newer run is on its way, the range of
 * before stands dimmed with a ring beside its heading (plan/phase-07-plan.md, step 21).
 */
export function SeriesRange({ view, isUpdating = false }: { view: Sized; isUpdating?: boolean }) {
  const heading = useId();
  const { range, chosen, verdict } = view;
  const bar = range ? seriesBarOf(range, chosen) : null;
  return (
    <section aria-labelledby={heading} data-testid="series-range" data-state={isUpdating && bar ? "updating" : "settled"} className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h2 id={heading} className={SECTION}>
          Modules in series
        </h2>
        {isUpdating && bar ? (
          <span data-testid="series-ring" className="flex">
            <ProgressRing size={16} />
          </span>
        ) : null}
        {bar ? <span className={classNames("ml-auto type-value-xs text-text-2", isUpdating && "opacity-updating")}>{bar.fits}</span> : null}
      </div>
      {bar ? (
        <div data-testid="series-bar" className={classNames("relative h-11", isUpdating && "opacity-updating")}>
          <div className="absolute inset-x-0 top-2 h-2 rounded-full bg-well shadow-well" />
          {bar.band ? <div data-testid="series-band" className="absolute top-2 left-at h-2 w-span rounded-full bg-ok opacity-band" style={measures({ at: bar.band.from, span: bar.band.to - bar.band.from })} /> : null}
          {bar.marker !== null ? <div data-testid="series-marker" className="absolute top-0.5 left-at h-5 w-1 -translate-x-1/2 rounded-full bg-accent shadow-halo-focus" style={measures({ at: bar.marker })} /> : null}
          {bar.band === null
            ? bar.ends.map((end) => <span key={end.words} className="absolute top-1 left-at h-4 w-px -translate-x-1/2 bg-text-3" style={measures({ at: end.share })} />)
            : null}
          {bar.ends.map((end) => (
            <span key={end.words} data-testid="series-end" className={classNames("absolute top-6.5 left-at -translate-x-1/2 type-tick whitespace-nowrap", end.isChosen ? "text-text" : "text-text-2")} style={measures({ at: end.share })}>
              {end.words}
            </span>
          ))}
        </div>
      ) : (
        <p role="status" className="flex h-11 items-center gap-2.5 type-caption text-text-2">
          <ProgressRing size={16} />
          Sizing the strings for {view.voltage} V
        </p>
      )}
      {verdict ? (
        <p data-testid="series-verdict" className={classNames("flex items-start gap-2 type-caption text-text-2", isUpdating && "opacity-updating")}>
          <StatusMark kind={verdict.ok ? "fits" : "note"} label={verdict.ok ? "Fits" : verdict.title} wordsShown={false} size={16} />
          <span className="flex flex-col gap-0.5">
            {verdict.ok ? null : <span className="font-medium text-text">{verdict.title}</span>}
            <span>{withTrueMinus(verdict.detail)}</span>
          </span>
        </p>
      ) : range === null ? (
        <Skeleton kind="text" className="w-full" />
      ) : null}
    </section>
  );
}
