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
import type { Size } from "@/components/shell/use-screen-size";

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
    <span className={classNames("flex items-center whitespace-nowrap text-text-2", compact ? "gap-1 type-body-touch desktop:type-body" : "gap-1.5 type-body-touch desktop:type-body")}>
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
      {legend.compact.lead ? <span className="type-body-touch desktop:type-body text-text-2">{legend.compact.lead}</span> : null}
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

/** What the legend says now: its entries, or that the strings follow the design run while the run is not of the layout shown. */
function useLegendWords() {
  const colouring = useView(stringsShownByOf);
  const option = useResults(chosenOptionOf);
  const positions = useResults(layoutOf)?.layout.modules.length ?? 0;
  const run = useStringsOfTheRun();
  if (colouring === null || option === null) return null;
  const legend = run ? stringLegendOf(run.strings, colouring, positions - run.strings.reduce((sum, string) => sum + string.modules.length, 0)) : null;
  const follows = (
    <span data-testid="string-legend" className="flex items-center gap-2 type-body-touch desktop:type-body whitespace-nowrap text-text-2">
      <ProgressRing size={16} />
      Wiring the strings
    </span>
  );
  return { legend, follows };
}

/**
 * The strings' colour switch and legend (V2 · 6, D92 kept; the board "The Strings step"): a bar at the stage's foot on
 * tablet and desktop, the switch beside the legend (by string, the note and the entries on a line of their own when they
 * are many), never over the roof; the stage is laid out above it. On phone it is not here: the sheet's head holds it
 * (`StringLegendInTheSheet`). Nothing where the run has no option.
 */
export function StringLegend({ size, className }: { size: Size; className?: string }) {
  const words = useLegendWords();
  if (words === null || size === "phone") return null;
  const { legend, follows } = words;
  const entries = legend ? (
    <div role="img" aria-label={legend.label} data-testid="string-legend" className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
      {legend.entries.map((entry) => (
        <Item key={entry.words} entry={entry} />
      ))}
    </div>
  ) : (
    follows
  );
  return (
    <div role="group" aria-label="Strings on the roof" data-testid="string-legend-bar" className={classNames("flex min-h-legend flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-chrome px-5 py-2.5 desktop:px-6", className)}>
      <StringColourSwitch />
      {legend?.note ? <span className="type-body-touch desktop:type-body text-text-2">{legend.note}</span> : null}
      {entries}
    </div>
  );
}

/** On phone the switch and the legend are the sheet's head, under the stage, not over the roof (V2 · 6, audit V2-78). */
export function StringLegendInTheSheet() {
  const words = useLegendWords();
  if (words === null) return null;
  const { legend, follows } = words;
  return (
    <div role="group" aria-label="Strings on the roof" className="flex flex-col gap-2.5">
      <StringColourSwitch fill />
      <div className="flex justify-center">{legend ? <Compact legend={legend} /> : follows}</div>
    </div>
  );
}
