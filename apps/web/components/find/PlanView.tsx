"use client";

import { useRef } from "react";
import { classNames } from "@/components/ui/class-names";
import { SCALE_BAR_MAX } from "@/components/ui/design-numbers";
import { measures } from "@/components/ui/measures";
import { shown } from "@/components/ui/number-entry";
import { StatusMark } from "@/components/ui/StatusMark";
import { useSize } from "@/components/ui/use-size";
import { scaleBarOf, type ScaleBar } from "@/lib/map/scale-bar";
import { edgesOf, midpointsOf, type XY } from "@/lib/outline/measure";
import { NorthIcon } from "./NorthIcon";

type Props = {
  /** The corners of the roof, in metres about its place; none before it is entered. */
  corners: readonly XY[];
  /** Why there is no map, said where the attribution would stand; null when the plan stands in for nothing. */
  reason: string | null;
  className?: string;
};

/** Pixels per metre at most: the roof of the demo at 5 fills 450 px. */
const SCALE_MAX = 5;
/** The roof fills this much of the shorter side of the stage. */
const FILLS = 0.6;
/** Metres a grid line stands from the next. */
const GRID_M = 10;
/** The extent the scale is worked out for at least, in metres: a small roof is not blown up. */
const EXTENT_MIN_M = 20;

const LABEL = "placed z-stage-overlay -translate-x-1/2 -translate-y-1/2 rounded-seg bg-ground px-2.25 py-0.75 type-value-small font-medium text-text shadow-tooltip select-none";

/**
 * The stage without a map: the plan of the roof entered by hand, north up on a grid of 10 m, with its
 * edge labels, a north mark and a scale bar; the reason there is no map where the attribution stands
 * (the board "Enter dimensions by hand").
 */
export function PlanView({ corners, reason, className }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const size = useSize(stage);
  const drawn = size ? planOf(corners, size) : null;

  return (
    <div ref={stage} data-testid="plan-view" className={classNames("relative size-full overflow-hidden bg-ground", className)}>
      {drawn ? (
        <svg width={drawn.width} height={drawn.height} viewBox={`0 0 ${drawn.width} ${drawn.height}`} role="img" aria-label="Plan of the roof, north up" className="absolute inset-0">
          {drawn.gridX.map((x) => (
            <line key={`x${x}`} x1={x} y1={0} x2={x} y2={drawn.height} className="stroke-line-subtle" />
          ))}
          {drawn.gridY.map((y) => (
            <line key={`y${y}`} x1={0} y1={y} x2={drawn.width} y2={y} className="stroke-line-subtle" />
          ))}
          {drawn.points.length >= 3 ? <polygon points={drawn.points.map(({ x, y }) => `${x},${y}`).join(" ")} className="fill-outline-fill stroke-accent stroke-outline" /> : null}
        </svg>
      ) : null}
      {drawn?.labels.map((label, n) => (
        <code key={n} data-testid="plan-label" className={LABEL} style={measures({ x: label.x, y: label.y })}>
          {label.words}
        </code>
      ))}
      {drawn && drawn.points.length < 3 ? (
        <p className="absolute inset-x-10 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5 text-center text-text-2">
          <span className="font-medium text-text">The plan of the roof is drawn here</span>
          <span className="type-small">Enter its length and width, or its corners.</span>
        </p>
      ) : null}
      <span aria-hidden="true" className="absolute top-21 right-5 flex size-touch items-center justify-center rounded-row border border-line bg-surface-1 shadow-float desktop:top-5 desktop:right-find-stage-inset desktop:mr-5">
        <NorthIcon />
      </span>
      <div className="pointer-events-none absolute bottom-7 left-5 flex flex-col gap-2 text-text">
        {drawn?.scale ? (
          <div data-testid="plan-scale" className="flex flex-col gap-0.75">
            <code className="type-value-xs">{drawn.scale.label}</code>
            <div className="w-31">
              <div className="h-1.25 w-span border-x border-b border-text" style={measures({ span: drawn.scale.widthPx / SCALE_BAR_MAX })} />
            </div>
          </div>
        ) : null}
        {reason ? (
          <p role="status" className="flex items-center gap-2 type-small text-text-2">
            <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
            {reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type Plan = {
  width: number;
  height: number;
  gridX: number[];
  gridY: number[];
  points: XY[];
  labels: { x: number; y: number; words: string }[];
  /** The largest round length that fits the scale bar; null when none does. */
  scale: ScaleBar | null;
};

/** The plan in pixels: the roof about the middle of the stage, north up, at a scale that fits it. */
export function planOf(corners: readonly XY[], size: { width: number; height: number }): Plan {
  const { width, height } = size;
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const extent = corners.length ? Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), EXTENT_MIN_M) : EXTENT_MIN_M;
  const pxPerM = Math.min(SCALE_MAX, (FILLS * Math.min(width, height)) / extent);
  const centre = corners.length
    ? { x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2 }
    : { x: 0, y: 0 };
  const toPx = ({ x, y }: XY): XY => ({ x: width / 2 + (x - centre.x) * pxPerM, y: height / 2 - (y - centre.y) * pxPerM });
  const step = GRID_M * pxPerM;
  const ticks = (from: number, extentPx: number) => {
    const lines: number[] = [];
    for (let at = from % step; at < extentPx; at += step) lines.push(Math.round(at * 100) / 100);
    return lines;
  };
  const origin = toPx({ x: 0, y: 0 });
  const points = corners.map(toPx);
  const labels = corners.length >= 2 ? midpointsOf(corners).map(toPx).map((at, n) => ({ ...at, words: `${shown(edgesOf(corners)[n], 1)} m` })) : [];
  return { width, height, gridX: ticks(origin.x, width), gridY: ticks(origin.y, height), points, labels, scale: scaleBarOf(1 / pxPerM, SCALE_BAR_MAX) };
}
