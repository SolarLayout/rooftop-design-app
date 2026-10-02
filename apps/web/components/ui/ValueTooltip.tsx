"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { classNames } from "./class-names";
import { TOOLTIP_GAP } from "./design-numbers";
import { measures } from "./measures";
import { placeOf, type Box } from "./place-floating";

type Props = {
  /** The bar or the marker the value belongs to, as it is on the screen; null while nothing is under the pointer. */
  anchor: Box | null;
  /** The value, first: "68.4 MWh · 191 kWh/kWp". */
  value: string;
  /** What it is of, after: "Mar". */
  label: string;
  /** Hears that the page moved while the tooltip was shown: its place would no longer be true. */
  onLeave: () => void;
};

const BUBBLE = classNames(
  "flex w-max flex-col rounded-item border border-line-strong bg-control-active px-2.5 py-1",
  "whitespace-nowrap shadow-tooltip pointer-events-none placed",
);

/**
 * The value of a chart under the pointer, the finger or the keyboard focus (components.md, "Tooltip"; plan/phase-08-plan.md,
 * decision 18): the value first, then what it is of, over the bar or the marker, in the top layer of the browser. It comes
 * at once. It is never the only place: the Table tab of the chart holds every value.
 */
export function ValueTooltip({ anchor, value, label, onLeave }: Props) {
  const bubble = useRef<HTMLDivElement>(null);

  // A popover is not seen until it is shown; shown, it is measured and put at its place before it is painted.
  useLayoutEffect(() => {
    const floating = bubble.current;
    if (!floating) return;
    if (anchor === null) {
      if (floating.matches(":popover-open")) floating.hidePopover();
      return;
    }
    if (!floating.matches(":popover-open")) floating.showPopover();
    const { x, y } = placeOf({
      anchor,
      size: floating.getBoundingClientRect(),
      screen: { width: window.innerWidth, height: window.innerHeight },
      side: "above",
      align: "middle",
      gap: TOOLTIP_GAP,
    });
    Object.assign(floating.style, measures({ x, y }));
  }, [anchor, value, label]);

  useEffect(() => {
    if (anchor === null) return;
    window.addEventListener("resize", onLeave);
    window.addEventListener("scroll", onLeave, true);
    return () => {
      window.removeEventListener("resize", onLeave);
      window.removeEventListener("scroll", onLeave, true);
    };
  }, [anchor, onLeave]);

  return (
    <div ref={bubble} role="tooltip" popover="manual" data-testid="value-tooltip" className={BUBBLE}>
      <span className="type-value-xs font-medium text-text">{value}</span>
      <span className="type-caption text-text-2">{label}</span>
    </div>
  );
}
