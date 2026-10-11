"use client";

import { useResults, useStores, useView } from "@/components/shell/stores";
import { useStringsOfTheRun } from "@/components/scene/use-strings";
import { classNames } from "@/components/ui/class-names";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Segmented } from "@/components/ui/Segmented";
import type { Colouring } from "@/lib/stores/string-colours";
import { stringLegendOf, type LegendEntry, type Swatch } from "@/lib/scene/string-legend";
import { chosenOptionOf, layoutOf } from "@/lib/stores/results-store";
import { stringColouringOf, stringsShownByOf } from "@/lib/stores/view-store";
import type { Size } from "./use-size";

const COLOURINGS: { value: Colouring; label: string }[] = [
  { value: "string", label: "String" },
  { value: "mppt", label: "MPPT" },
  { value: "inverter", label: "Inverter" },
];

/** The swatch of each series colour, by its number, and of the positions not used: the CSS tokens the palette equals. */
const SWATCH: Record<Swatch, string> = {
  1: "bg-series-1",
  2: "bg-series-2",
  3: "bg-series-3",
  4: "bg-series-4",
  5: "bg-series-5",
  6: "bg-series-6",
  unused: "bg-series-unused",
};

export const swatchClassOf = (swatch: Swatch) => SWATCH[swatch] ?? SWATCH[1];

/** What the strings are coloured by: String, MPPT or Inverter (the boards "Studio, Strings lens" and "Strings on the roof"). */
export function StringColourSwitch({ fill = false, className }: { fill?: boolean; className?: string }) {
  const { view } = useStores();
  const colouring = useView(stringColouringOf);
  return <Segmented label="Colour the strings by" fill={fill} options={COLOURINGS} value={colouring} onChange={(chosen) => view.getState().colourStringsBy(chosen)} className={className} />;
}

function Item({ entry, compact = false }: { entry: LegendEntry; compact?: boolean }) {
  return (
    <span className={classNames("flex items-center whitespace-nowrap text-text-2", compact ? "gap-1 type-value-xs" : "gap-1.5 type-caption")}>
      <span aria-hidden="true" className={classNames("block shrink-0 rounded-key", compact ? "size-2.5" : "size-3", swatchClassOf(entry.swatch))} />
      {entry.words}
    </span>
  );
}

/**
 * The legend where room is short: the lead word and the numbers each beside its swatch, a rule, then Not used. The rule
 * and Not used keep to the line of the last colour (D92), so that no line of the wrapped legend starts with the rule.
 */
function Compact({ legend }: { legend: ReturnType<typeof stringLegendOf> }) {
  const unused = legend.entries.find((entry) => entry.swatch === "unused");
  const numbered = legend.compact.lead !== null;
  const leading = legend.compact.items.slice(0, -1);
  const last = legend.compact.items.at(-1);
  return (
    <div role="img" aria-label={legend.label} data-testid="string-legend" className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
      {legend.compact.lead ? <span className="type-caption text-text-2">{legend.compact.lead}</span> : null}
      {leading.map((entry) => (
        <Item key={entry.words} entry={entry} compact={numbered} />
      ))}
      {last ? (
        <span className="flex items-center gap-x-2.5">
          <Item entry={last} compact={numbered} />
          {unused ? (
            <>
              <span aria-hidden="true" className="block h-3.5 w-px bg-line-strong" />
              <Item entry={unused} compact />
            </>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The strings' colour switch and legend on the stage (plan/phase-07-plan.md, step 14; components.md, "Strings on the
 * roof"): in the Strings lens, while the run has an option. On desktop a card at the bottom left over the time pill,
 * the switch beside the legend (by string the legend on a line of its own); on tablet a card at the bottom right, the
 * switch over the compact legend; on phone the compact legend alone, the switch being in the sheet. While the run is
 * not of the layout shown, the legend says that the strings follow it, with the ring. One entry per colour (D92); on
 * desktop the card is as wide as its legend and wraps within the stage when that is wider.
 */
export function StringLegend({ size, className }: { size: Size; className?: string }) {
  const colouring = useView(stringsShownByOf);
  const option = useResults(chosenOptionOf);
  const positions = useResults(layoutOf)?.layout.modules.length ?? 0;
  const run = useStringsOfTheRun();
  if (colouring === null || option === null) return null;
  const legend = run ? stringLegendOf(run.strings, colouring, positions - run.strings.reduce((sum, string) => sum + string.modules.length, 0)) : null;
  const follows = (
    <span data-testid="string-legend" className="flex items-center gap-2 type-caption whitespace-nowrap text-text-2">
      <ProgressRing size={16} />
      The strings follow the design run
    </span>
  );

  const card = "rounded-card-s border border-line bg-surface-1 shadow-float";
  if (size === "phone") {
    return <div className={classNames("flex min-h-8 items-center rounded-control border border-line bg-surface-1 px-3 py-1.5 shadow-float", className)}>{legend ? <Compact legend={legend} /> : follows}</div>;
  }
  if (size === "tablet") {
    return (
      <div role="group" aria-label="Strings on the roof" className={classNames("flex w-96 flex-col gap-2 rounded-bar border border-line bg-surface-1 px-1.5 pt-1.5 pb-2.5 shadow-float", className)}>
        <StringColourSwitch fill />
        <div className="flex justify-center">{legend ? <Compact legend={legend} /> : follows}</div>
      </div>
    );
  }
  const entries = legend ? (
    <div role="img" aria-label={legend.label} data-testid="string-legend" className={classNames("flex flex-wrap items-center gap-x-3.5 gap-y-1.5", legend.note && "pl-2.5")}>
      {legend.entries.map((entry) => (
        <Item key={entry.words} entry={entry} />
      ))}
    </div>
  ) : (
    follows
  );
  if (legend?.note) {
    return (
      <div role="group" aria-label="Strings on the roof" className={classNames("flex w-fit flex-col gap-2 pt-1.5 pr-4 pb-2.5 pl-1.5", card, className)}>
        <div className="flex items-center gap-3.5 whitespace-nowrap">
          <StringColourSwitch />
          <span className="type-caption text-text-2">{legend.note}</span>
        </div>
        {entries}
      </div>
    );
  }
  return (
    <div role="group" aria-label="Strings on the roof" className={classNames("flex min-h-12 w-fit items-center gap-3.5 py-1.5 pr-4 pl-1.5", card, className)}>
      <StringColourSwitch />
      {entries}
    </div>
  );
}
