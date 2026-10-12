"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { classNames } from "@/components/ui/class-names";
import { CHART_LINE_BAND, CHART_LINE_TOP, MARKER_RADIUS, MARKER_RING } from "@/components/ui/design-numbers";
import { NumberField } from "@/components/ui/NumberField";
import { isStill, type Box } from "@/components/ui/place-floating";
import { Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useSize } from "@/components/ui/use-size";
import { ValueTooltip } from "@/components/ui/ValueTooltip";
import type { Energy } from "@/lib/api";
import { DEGRADATION_RANGE, DEGRADATION_UNIT } from "@/lib/performance/degradation";
import { nearestYear, TOTAL_ROW, YEAR_COLUMNS, yearLabelsOf, yearPointsOf, yearRowsOf, yearSaidOf, yearTooltipOf } from "@/lib/performance/year-line";
import { CHART_CARD, CHART_TABS, CHART_TITLE, dimmed, type ChartTab } from "./chart-card";

type Props = {
  energy: Energy;
  /** The document's degradation, in %/yr. */
  degradation: number | null;
  /** Hears a degradation committed: an edit of the document, which the run follows. */
  onDegradation: (pct: number) => void;
  /** The values are of before, and a new run is on its way: they stay, dimmed. */
  isDimmed: boolean;
};

const TITLE = "25 years";
const FIRST_YEAR = 1;
const LAST_YEAR = 25;

// The keys that move the year under the focus.
const STEP: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };

const PLOT = "absolute inset-0 cursor-crosshair rounded-control focus-ring";

/**
 * The energy over 25 years (the board "25 years"; plan/phase-08-plan.md, step 14): the degradation as a field of the
 * document in the head, Chart and Table as tabs. The chart: the line fitted to the run's own extremes with its wash,
 * the six years under it; under the pointer a crosshair snaps to the nearest year with its marker and its tooltip; the
 * plot takes the keyboard focus and the arrows move the year. The table: six years and the total.
 */
export function YearsChart({ energy, degradation, onDegradation, isDimmed }: Props) {
  const heading = useId();
  const [tab, setTab] = useState<ChartTab>("chart");
  const [active, setActive] = useState<number | null>(null);
  const [plotBox, setPlotBox] = useState<Box | null>(null);
  const plot = useRef<HTMLDivElement>(null);
  const size = useSize(plot);
  /** The year the keyboard focus comes back to: the last one shown. */
  const [kept, setKept] = useState(FIRST_YEAR);

  const leave = useCallback(() => setActive(null), []);
  /** The page moved somewhere: the tooltip goes only if the plot itself is no longer where it was measured. */
  const leaveIfMoved = useCallback(() => {
    const element = plot.current;
    if (element && plotBox && isStill(plotBox, element.getBoundingClientRect())) return;
    setActive(null);
  }, [plotBox]);
  /** Whether the focus about to come was brought by a pointer: the browser's own :focus-visible is not settled at focus time. */
  const byPointer = useRef(false);

  function show(year: number, element: HTMLElement) {
    if (year === active) return;
    const { left, top, width, height } = element.getBoundingClientRect();
    setKept(year);
    setActive(year);
    setPlotBox({ left, top, width, height });
  }

  function yearAt(event: PointerEvent<HTMLDivElement>): number {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    return nearestYear(width > 0 ? (event.clientX - left) / width : 0, energy.years_mwh.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const from = active ?? kept;
    const next = event.key === "Home" ? FIRST_YEAR : event.key === "End" ? LAST_YEAR : STEP[event.key] === undefined ? null : from + STEP[event.key]!;
    if (event.key === "Escape") return leave();
    if (next === null) return;
    event.preventDefault();
    show(Math.min(LAST_YEAR, Math.max(FIRST_YEAR, next)), event.currentTarget);
  }

  const points = yearPointsOf(energy);
  const labels = yearLabelsOf(energy);
  const width = size?.width ?? 0;
  const height = size?.height ?? 0;
  const xOf = (x: number) => x * width;
  const yOf = (y: number) => CHART_LINE_TOP + y * CHART_LINE_BAND;
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${xOf(point.x).toFixed(1)} ${yOf(point.y).toFixed(1)}`).join(" ");
  const wash = `${line} L${width.toFixed(1)} ${height} L0 ${height} Z`;
  const marked = active === null ? null : points[active - 1]!;
  const anchor: Box | null =
    marked && plotBox
      ? { left: plotBox.left + xOf(marked.x) - MARKER_RADIUS, top: plotBox.top + yOf(marked.y) - MARKER_RADIUS, width: 2 * MARKER_RADIUS, height: 2 * MARKER_RADIUS }
      : null;
  const tooltip = yearTooltipOf(energy, active ?? kept);

  return (
    <section data-testid="years-chart" aria-labelledby={heading} className={CHART_CARD}>
      <Tabs
        label={TITLE}
        head={{
          title: (
            <h2 id={heading} className={CHART_TITLE}>
              {TITLE}
            </h2>
          ),
          aside: <NumberField label="Degradation" value={degradation} onCommit={onDegradation} range={DEGRADATION_RANGE} unit={DEGRADATION_UNIT} />,
        }}
        tabs={CHART_TABS}
        value={tab}
        onChange={setTab}
      >
        {tab === "chart" ? (
          <div className={classNames("flex flex-col gap-3", dimmed(isDimmed))}>
            <div ref={plot} data-testid="years-plot" className="relative h-18">
              {size ? (
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="absolute inset-0 overflow-visible">
                  <path d={wash} className="fill-data-gain opacity-wash" />
                  <path d={line} className="fill-none stroke-data-gain stroke-chart" strokeLinejoin="round" strokeLinecap="round" />
                  {marked ? (
                    <>
                      <line data-testid="crosshair" x1={xOf(marked.x)} y1={0} x2={xOf(marked.x)} y2={height} className="stroke-line-strong stroke-hair" />
                      <circle cx={xOf(marked.x)} cy={yOf(marked.y)} r={MARKER_RADIUS + MARKER_RING} className="fill-surface-1" />
                      <circle data-testid="marker" cx={xOf(marked.x)} cy={yOf(marked.y)} r={MARKER_RADIUS} className="fill-data-gain" />
                    </>
                  ) : null}
                </svg>
              ) : null}
              {/* The plot is the target: the pointer, a finger or the arrows choose the year. */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Year"
                aria-valuemin={FIRST_YEAR}
                aria-valuemax={LAST_YEAR}
                aria-valuenow={active ?? kept}
                aria-valuetext={yearSaidOf(energy, active ?? kept)}
                className={PLOT}
                onPointerMove={(event) => {
                  if (event.pointerType === "mouse") show(yearAt(event), event.currentTarget);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === "mouse") leave();
                }}
                onPointerDown={(event) => {
                  byPointer.current = true;
                  if (event.pointerType !== "mouse") show(yearAt(event), event.currentTarget);
                }}
                onFocus={(event) => {
                  // The keyboard's focus shows the year kept; a pointer's shows what it points at itself.
                  if (!byPointer.current) show(kept, event.currentTarget);
                  byPointer.current = false;
                }}
                onBlur={leave}
                onKeyDown={onKeyDown}
              />
            </div>
            <div className="grid grid-cols-6 gap-2">
              {labels.map((label, index) => (
                <div key={label.year} data-testid="year-label" className={classNames("flex min-w-0 flex-col gap-0.5", index === labels.length - 1 && "text-right")}>
                  <span className="type-body-touch desktop:type-body text-text-2">{label.label}</span>
                  <span data-testid="year-value" className="type-mono-touch desktop:type-mono">
                    {label.mwh}
                  </span>
                </div>
              ))}
            </div>
            <ValueTooltip anchor={anchor} value={tooltip.value} label={tooltip.label} onLeave={leaveIfMoved} />
          </div>
        ) : (
          <Table
            caption="Every year is in the chart; the table says six of them and the total."
            columns={YEAR_COLUMNS}
            rows={yearRowsOf(energy)}
            keyOf={(row) => row.key}
            total={TOTAL_ROW}
            className={dimmed(isDimmed)}
          />
        )}
      </Tabs>
    </section>
  );
}
