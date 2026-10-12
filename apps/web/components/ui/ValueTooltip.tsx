"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { classNames } from "./class-names";
import { TOOLTIP_GAP } from "./design-numbers";
import { measures } from "./measures";
import { placeOf, type Box, type Side } from "./place-floating";

type Props = {
  /** The bar or the marker the value belongs to, as it is on the screen; null while nothing is under the pointer. */
  anchor: Box | null;
  /** The value, first: "68.4 MWh · 191 kWh/kWp". */
  value: string;
  /** What it is of, after: "Mar". */
  label: string;
  /** Hears that the page scrolled or resized while the tooltip was shown; the chart leaves when its anchor moved (`isStill`). */
  onLeave: () => void;
  /** Over the bar or the marker, or at the right of a block of the single-line diagram, so that no other block is hidden. */
  side?: Extract<Side, "above" | "right">;
};

const BUBBLE = classNames(
  "flex w-max flex-col rounded-control border border-line-strong bg-control-active px-2.5 py-1",
  "whitespace-nowrap shadow-tooltip pointer-events-none placed",
);

/**
 * The value of a chart under the pointer, the finger or the keyboard focus (components.md, "Tooltip"; plan/phase-08-plan.md,
 * decision 18): the value first, then what it is of, over the bar or the marker (or beside a block of the single-line
 * diagram), in the top layer of the browser. It comes at once. It is never the only place: the Table tab of the chart holds
 * every value, the list of the diagram every block.
 */
export function ValueTooltip({ anchor, value, label, onLeave, side = "above" }: Props) {
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
      side,
      align: "middle",
      gap: TOOLTIP_GAP,
    });
    // A custom property is set by name: assigned as a field of the style it is not written, and the tooltip would stay at
    // the top left corner of the screen (found in Phase 9: the tooltips of the charts had stood there since Phase 8).
    for (const [name, measure] of Object.entries(measures({ x, y }))) floating.style.setProperty(name, String(measure));
  }, [anchor, value, label, side]);

  const isShown = anchor !== null;
  useEffect(() => {
    if (!isShown) return;
    window.addEventListener("resize", onLeave);
    window.addEventListener("scroll", onLeave, true);
    return () => {
      window.removeEventListener("resize", onLeave);
      window.removeEventListener("scroll", onLeave, true);
    };
  }, [isShown, onLeave]);

  return (
    // The popover's own display is overridden by its classes while it is closed: it is kept from the eye and from the
    // accessibility tree by being invisible, as the chain's readout is.
    <div ref={bubble} role="tooltip" popover="manual" data-testid="value-tooltip" className={classNames(BUBBLE, !isShown && "invisible")}>
      <span className="type-body-touch desktop:type-body font-medium text-text">{value}</span>
      <span className="type-body-touch desktop:type-body text-text-2">{label}</span>
    </div>
  );
}
