"use client";

import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { useId } from "react";
import { useResults } from "@/components/shell/stores";
import { useShadeMapOfTheRun } from "@/components/scene/use-shade-map";
import { classNames } from "@/components/ui/class-names";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stat } from "@/components/ui/Stat";
import { shown } from "@/components/ui/number-entry";
import { legendOf } from "@/lib/scene/shade-map";
import { designOf, layoutOf, readoutsOf } from "@/lib/stores/results-store";
import { figuresOf, type Figure } from "@/lib/studio/sun-figures";
import type { Size } from "./use-size";

/** A figure as a tile: its value in percent, what it waits for in words, or a skeleton before any run. */
function FigureTile({ label, figure }: { label: string; figure: Figure }) {
  if (figure.value !== null) return <Stat look="tile" label={label} value={figure.value} unit="%" />;
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-row bg-surface-2 px-3.5 py-2.5">
      <dt className="type-caption text-text-2">{label}</dt>
      <dd className="flex min-h-5 items-center">{figure.waits ? <span className="type-caption text-text">{figure.waits}</span> : <Skeleton kind="value" className="w-14" onTile />}</dd>
    </div>
  );
}

/**
 * Shading over the year (the board "Studio, Sun lens"; plan/phase-06-plan.md, decision 13): near linear,
 * electrical beyond linear, far (the horizon) and the area kept clear, as tiles; under them what they count
 * and the engine's note on the horizon.
 */
export function ShadingSection() {
  const design = useResults(designOf);
  const readouts = useResults(readoutsOf);
  const figures = figuresOf(design, readouts?.keepout_area_m2 ?? null);
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-3">
      <SectionHeading id={heading} help="studio.section.shading-over-the-year">
        Shading over the year
      </SectionHeading>
      <dl className="grid grid-cols-2 gap-2">
        <FigureTile label="Near, linear" figure={figures.near} />
        <FigureTile label="Electrical, beyond linear" figure={figures.electrical} />
        <FigureTile label="Far, horizon" figure={figures.far} />
        {figures.keptClear !== null ? <Stat look="tile" label="Kept clear" value={figures.keptClear} unit="m²" /> : <FigureTile label="Kept clear" figure={{ value: null, waits: null }} />}
      </dl>
      {figures.of || figures.horizon ? (
        <p className="flex flex-col type-caption text-text-3">
          {figures.of ? <span data-testid="shading-of">{figures.of}</span> : null}
          {figures.horizon ? <span data-testid="shading-horizon">{figures.horizon}</span> : null}
        </p>
      ) : null}
    </section>
  );
}

/** The five steps of the map, as on the stage. */
const SWATCHES = ["bg-shade-1", "bg-shade-2", "bg-shade-3", "bg-shade-4", "bg-shade-5"];

/**
 * The Shade map tab (the board "Shade map"): what the map colours, and each step with its range and how many
 * positions are in it; while the run is not of the layout shown, that the map follows the run.
 */
export function ShadeMapSection({ size }: { size: Size }) {
  const map = useShadeMapOfTheRun();
  const positions = useResults(layoutOf)?.layout.modules.length ?? 0;
  const legend = legendOf(map, positions);
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-3">
      <SectionHeading id={heading} help="studio.section.shade-map">
        Shade map
      </SectionHeading>
      <p className="type-caption text-text-2">
        {map
          ? `Each module is coloured by its near shading over the year, of all ${shown(positions, 0)} positions. ${size === "desktop" ? "Select" : "Tap"} a module for its value.`
          : legend.of}
      </p>
      {map ? (
        <ul className="flex flex-col gap-1.5">
          {map.counts.map((count, step) => (
            <li key={step} data-testid="shade-step" className={classNames("flex items-center gap-3", size !== "desktop" && "min-h-touch")}>
              <span aria-hidden="true" className={classNames("block h-2.5 w-4 shrink-0 rounded-xs", SWATCHES[step])} />
              <span className="type-value-xs text-text">
                {legend.marks[step]} to {legend.marks[step + 1]?.replace(" %", "")} %
              </span>
              <span className="ml-auto type-caption text-text-2">
                <span className="type-value-xs text-text">{count}</span> {count === 1 ? "position" : "positions"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
