"use client";

import { useResults, useView } from "@/components/shell/stores";
import { useShadeMapOfTheRun } from "@/components/scene/use-shade-map";
import { classNames } from "@/components/ui/class-names";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { legendOf } from "@/lib/scene/shade-map";
import { layoutOf } from "@/lib/stores/results-store";
import { isShadeMapShownOf } from "@/lib/stores/view-store";
import type { Size } from "./use-size";

/** The five steps of the map, from the least shaded to the most. */
const SWATCHES = ["bg-shade-1", "bg-shade-2", "bg-shade-3", "bg-shade-4", "bg-shade-5"];

/**
 * The legend of the shade map on the stage (the board "Shade map"; plan/phase-06-plan.md, decision 11): what
 * is coloured, the five steps with the marks of the scale, and what it counts; while the run is not of the
 * layout shown, that the map follows the run, with the ring. On phone the marks of the ends alone.
 */
export function ShadeLegend({ size, className }: { size: Size; className?: string }) {
  const isShown = useView(isShadeMapShownOf);
  const map = useShadeMapOfTheRun();
  const positions = useResults(layoutOf)?.layout.modules.length ?? 0;
  if (!isShown) return null;
  const legend = legendOf(map, positions);
  const marks = size === "phone" && legend.marks.length ? [legend.marks[0], legend.marks.at(-1) ?? ""] : legend.marks;

  return (
    <div data-testid="shade-legend" className={classNames("flex flex-col gap-1.5 rounded-row border border-line bg-surface-1 px-3 py-2.5 shadow-float", className)}>
      <span className="type-caption font-medium text-text">{legend.title}</span>
      {map ? (
        <>
          <span className="flex gap-0.5" aria-hidden="true">
            {SWATCHES.map((swatch) => (
              <span key={swatch} className={classNames("block h-2.5 rounded-xs", size === "phone" ? "w-6" : "w-10", swatch)} />
            ))}
          </span>
          <span className="flex justify-between type-tick text-text-3" aria-hidden="true">
            {marks.map((mark, index) => (
              <span key={index}>{mark}</span>
            ))}
          </span>
          {size === "phone" ? null : <span className="type-caption text-text-2">{legend.of}</span>}
        </>
      ) : (
        <span className="flex items-center gap-2 type-caption text-text-2">
          <ProgressRing size={16} />
          {legend.of}
        </span>
      )}
    </div>
  );
}
