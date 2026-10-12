import type { ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import type { Axis } from "@/lib/performance/chart-axis";

// What the charts of Performance's tabs share (V2 · 8, D104; guidelines.md, "Charts"): the head with the title at the left
// and Chart and Table at the right, the labelled axis at the plot's left, the tabs of a chart.

/** The plot stands right of the axis's labels: placed, or in the flow under it. */
export const PLOT_INSET = "left-10";
export const PLOT_MARGIN = "ml-10";

/** The Chart and Table of a chart. */
export const CHART_TABS = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
] as const;

export type ChartTab = (typeof CHART_TABS)[number]["value"];

/** The body of a tab while a run is on its way: the values of before, dimmed. */
export const dimmed = (isDimmed: boolean) => classNames(isDimmed && "opacity-updating");

/** The title of a chart at the left, in text-2, and what stands at its right: Chart and Table. */
export function ChartHead({ id, title, line, aside }: { id: string; title: string; line?: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 id={id} className="type-body-touch desktop:type-body text-text-2">
          {title}
        </h3>
        {line ? <p className="type-body-touch desktop:type-body text-text">{line}</p> : null}
      </div>
      {aside}
    </div>
  );
}

/** The axis at the plot's left: its unit over it, a label and a line at each tick, from the foot up. */
export function AxisTicks({ axis, unit }: { axis: Axis; unit: string }) {
  const span = axis.high - axis.low;
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <span className="absolute -top-8 left-0 type-unit text-text-3">{unit}</span>
      {axis.ticks.map((tick) => (
        <div key={tick} className="absolute inset-x-0 top-down" style={measures({ down: span > 0 ? (axis.high - tick) / span : 0 })}>
          <span className="absolute left-0 w-8 -translate-y-1/2 text-right type-unit text-text-3">{tick.toLocaleString("en-US")}</span>
          <span className={classNames("absolute right-0 left-10 border-t", tick === axis.low ? "border-line-strong" : "border-line-subtle")} />
        </div>
      ))}
    </div>
  );
}
