"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { isStill, type Box } from "@/components/ui/place-floating";
import { Segmented } from "@/components/ui/Segmented";
import { Table } from "@/components/ui/Table";
import { ValueTooltip } from "@/components/ui/ValueTooltip";
import type { Energy } from "@/lib/api";
import { MONTH_COLUMNS, monthAxisOf, monthBarsOf, monthRowsOf, YEAR_ROW } from "@/lib/performance/month-bars";
import { AxisTicks, CHART_TABS, ChartHead, dimmed, PLOT_INSET, PLOT_MARGIN, type ChartTab } from "./chart-card";

type Props = {
  energy: Energy;
  /** The values are of before, and a new run is on its way: they stay, dimmed. */
  isDimmed: boolean;
};

const TITLE = "Energy to the grid each month of year 1";

// Twelve columns with the board's gaps: 10 on desktop, 6 on tablet, 4 on phone, and the plot's padding at the sides.
const COLUMNS = "grid grid-cols-12 gap-1 px-0.5 tablet:gap-1.5 tablet:px-1 desktop:gap-2.5";
// The whole column is the target of a bar; it lifts the bar under the pointer and carries its name.
const HIT = "relative flex h-full min-w-0 cursor-default items-end rounded-control focus-ring";
const BAR = "relative block w-full rounded-t-bar-end bg-data-gain h-span";
const LABEL = "absolute -inset-x-2.5 -top-4.5 text-center type-unit text-text";

/**
 * By month (V2 · 8, D104; plan/phase-08-plan.md, step 13): the title at the left, Chart and Table at the right (audit
 * V2-71). The chart: twelve bars on a labelled MWh axis from zero, the highest and the lowest labelled beside their bars
 * in the text colour (audit V2-119); on touch the months by their initials; under the pointer, the finger or the keyboard
 * focus a bar lifts and its tooltip says the value and the month. The table: the months with MWh and kWh/kWp, the year last.
 */
export function MonthlyChart({ energy, isDimmed }: Props) {
  const heading = useId();
  const [tab, setTab] = useState<ChartTab>("chart");
  const [active, setActive] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<Box | null>(null);
  const bars = useRef<Array<HTMLSpanElement | null>>([]);
  // What the pointer was, and whether its bar was shown already, at the press: a tap on a shown bar takes it away.
  const press = useRef<{ pointerType: string; wasShown: boolean }>({ pointerType: "", wasShown: false });
  const view = monthBarsOf(energy);
  const axis = monthAxisOf(energy);

  const leave = useCallback(() => {
    setActive(null);
    setAnchor(null);
  }, []);

  /** The page moved somewhere: the tooltip goes only if its bar is no longer where it was measured. */
  const leaveIfMoved = useCallback(() => {
    const bar = active === null ? null : bars.current[active];
    if (bar && anchor && isStill(anchor, bar.getBoundingClientRect())) return;
    leave();
  }, [active, anchor, leave]);

  function show(index: number) {
    const bar = bars.current[index];
    if (!bar) return;
    const { left, top, width, height } = bar.getBoundingClientRect();
    setActive(index);
    setAnchor({ left, top, width, height });
  }

  // The pointer that can hover shows a bar as it passes; a finger shows it with a tap, and takes it away with another.
  function onPointerEnter(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (event.pointerType === "mouse") show(index);
  }
  function onPointerLeave(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse") leave();
  }
  function onClick(index: number) {
    if (press.current.pointerType !== "touch") return;
    if (press.current.wasShown) leave();
    else show(index);
  }
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") leave();
  }

  const shown = active === null ? null : view[active]!;

  return (
    <section data-testid="monthly-chart" aria-labelledby={heading} className="flex flex-col gap-3">
      <ChartHead id={heading} title={TITLE} aside={<Segmented label="Show the months as" options={CHART_TABS} value={tab} onChange={setTab} />} />
      {tab === "chart" ? (
        <div className={classNames("flex flex-col gap-2", dimmed(isDimmed))}>
          <div className="relative h-44 tablet:h-48">
            {/* The plot: the axis at the left, the bars from the baseline, room over the highest for its label. */}
            <div className="absolute inset-x-0 top-8 bottom-0">
              <AxisTicks axis={axis} unit="MWh" />
              <div className={classNames("absolute top-0 right-0 bottom-0", PLOT_INSET, COLUMNS)}>
                {view.map((bar, index) => (
                  <button
                    key={bar.month}
                    type="button"
                    data-testid="month-bar"
                    data-month={bar.month}
                    aria-label={bar.name}
                    className={HIT}
                    onPointerDown={(event) => {
                      press.current = { pointerType: event.pointerType, wasShown: active === index };
                    }}
                    onPointerEnter={(event) => onPointerEnter(event, index)}
                    onPointerLeave={onPointerLeave}
                    onFocus={() => show(index)}
                    onBlur={leave}
                    onClick={() => onClick(index)}
                    onKeyDown={onKeyDown}
                  >
                    <span
                      ref={(element) => {
                        bars.current[index] = element;
                      }}
                      data-testid="bar"
                      className={classNames(BAR, active === index && "lifted")}
                      style={measures({ span: bar.share })}
                    >
                      {/* The extreme's label gives way to the tooltip while it is shown. */}
                      {bar.label !== null && active !== index ? (
                        <span data-testid="bar-label" className={LABEL}>
                          {bar.label}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div aria-hidden="true" className={classNames(PLOT_MARGIN, COLUMNS, "text-center type-unit text-text-2")}>
            {view.map((bar) => (
              <span key={bar.month} className="min-w-0 truncate">
                <span className="desktop:hidden">{bar.initial}</span>
                <span className="hidden desktop:inline">{bar.month}</span>
              </span>
            ))}
          </div>
          <ValueTooltip anchor={anchor} value={shown?.tooltip.value ?? ""} label={shown?.tooltip.label ?? ""} onLeave={leaveIfMoved} />
        </div>
      ) : (
        <Table
          caption="The energy to the grid of every month, and of the year"
          columns={MONTH_COLUMNS}
          rows={monthRowsOf(energy)}
          keyOf={(row) => row.key}
          total={YEAR_ROW}
          className={dimmed(isDimmed)}
        />
      )}
    </section>
  );
}
