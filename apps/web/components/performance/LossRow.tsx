"use client";

import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { NumberField } from "@/components/ui/NumberField";
import { Switch } from "@/components/ui/Switch";
import type { BarLook, Mark } from "@/lib/format/cascade";
import type { ChainRow, Readout as ReadoutWords } from "@/lib/performance/loss-chain";
import type { LossControl, LossFieldId } from "@/lib/performance/loss-fields";
import type { RefObject } from "react";
import type { Place } from "@/components/ui/place-floating";
import { useReadout } from "./use-readout";

type Props = {
  row: ChainRow;
  /** The field or the switch where the step is the user's; null for a step of the engine's own. */
  control: LossControl | null;
  /** The figures are of before, and a new run is on its way: they stay, dimmed; the labels and the fields do not. */
  isDimmed: boolean;
  onField: (id: LossFieldId, value: number | null) => void;
  onSwitch: (on: boolean) => void;
};

// One line from tablet up: 29 high on desktop, 44 on tablet; a total 32 and 48. On phone each cell has its own line.
const LINE = "tablet:h-11 desktop:h-7.25";
const TOTAL_LINE = "tablet:h-12 desktop:h-8";
const ROW = "loss-row items-center gap-x-2.5 whitespace-nowrap -mx-2 rounded-xs px-2 py-1 tablet:py-0 hovered:bg-surface-2";
const LABEL = "area-label flex items-center type-body-touch tablet:type-body desktop:type-small";
const FIGURE = "type-value-small text-right";
// The track keeps 8 free at the left and 6 at the right on phone, 10 and 7 from tablet up, as the boards draw it.
const TRACK = "area-track relative block pl-2 pr-1.5 tablet:pl-2.5 tablet:pr-1.75";
const BAR = "absolute top-1/2 h-3 -translate-y-1/2 left-at tablet:h-3.5";
const LOOK: Record<BarLook, string> = { gain: "bg-data-gain", loss: "bg-data-loss", zero: "bg-data-zero" };

/** A step's bar from the running total before it to the one after; a step of nothing a tick of 1; a total a marker of 2. */
function TrackMark({ mark }: { mark: Mark }) {
  if (mark.kind === "marker") return <span data-look="marker" className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 left-at bg-text" style={measures({ at: mark.at })} />;
  if (mark.look === "zero") return <span data-look="zero" className={classNames(BAR, "w-px", LOOK.zero)} style={measures({ at: mark.to })} />;
  return (
    <span
      data-look={mark.look}
      className={classNames(BAR, "min-w-0.5 w-span rounded-swatch", LOOK[mark.look])}
      style={measures({ at: Math.min(mark.from, mark.to), span: Math.abs(mark.to - mark.from) })}
    />
  );
}

/** The control of a step that is the user's, in the second column; nothing for a step of the engine's own. */
function Control({ control, onField, onSwitch }: Pick<Props, "control" | "onField" | "onSwitch">) {
  if (!control) return null;
  if (control.kind === "switch") {
    return (
      <>
        <Switch label={control.label} on={control.on} disabled={control.disabled} onChange={onSwitch} className="area-field justify-self-start" />
        {control.note ? <p className="area-under type-caption text-text-2">{control.note}</p> : null}
      </>
    );
  }
  const { id, label, unit, range, value, detail, reset } = control;
  return (
    <>
      <NumberField form="chain" label={label} value={value} unit={unit} range={range} placeholder={value === null ? (detail ?? undefined) : undefined} onCommit={(entered) => onField(id, entered)} />
      {value !== null && (detail || reset) ? (
        <div className="area-under flex items-center gap-2 type-caption text-text-3">
          {detail ? <span>{detail}</span> : null}
          {reset ? (
            <Button kind="quiet" size="s" onClick={() => onField(id, null)}>
              {reset}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

const READOUT = classNames(
  "pointer-events-none placed flex flex-col rounded-item border border-line-strong bg-control-active px-2.5 py-1",
  "type-caption whitespace-nowrap text-text shadow-tooltip",
);

/** The readout over the row (decision 18), in the tooltip's look: the figure, then the label. Never the only place. */
function Readout({ ref, place, words }: { ref: RefObject<HTMLDivElement | null>; place: Place | null; words: ReadoutWords }) {
  return (
    <div
      ref={ref}
      role="tooltip"
      popover="manual"
      data-testid="readout"
      // It is measured where it is not seen, then shown at its place.
      className={classNames(READOUT, place === null && "invisible")}
      style={measures(place === null ? {} : { x: place.x, y: place.y })}
    >
      <span className="type-value-xs font-medium">{words.figure}</span>
      <span className="text-text-2">{words.label}</span>
    </div>
  );
}

function TotalCells({ row, dim }: { row: ChainRow; dim: string | false }) {
  return (
    <>
      <span data-testid="step-label" className={classNames(LABEL, TOTAL_LINE, "font-semibold text-text")}>{row.label}</span>
      <span className={classNames(TRACK, "h-5", TOTAL_LINE, dim)}>
        <span className="relative block h-full">
          <TrackMark mark={row.mark} />
        </span>
      </span>
      <span data-testid="running-total" className={classNames("area-total", FIGURE, TOTAL_LINE, "flex items-center justify-end gap-1.5 font-medium text-text", dim)}>
        {row.total}
        <span className="font-normal text-text-2">{row.unit}</span>
      </span>
    </>
  );
}

function StepCells({ row, dim, control, onField, onSwitch }: { row: ChainRow; dim: string | false } & Pick<Props, "control" | "onField" | "onSwitch">) {
  return (
    <>
      <span data-testid="step-label" className={classNames(LABEL, LINE, "text-text-2")}>{row.label}</span>
      <Control control={control} onField={onField} onSwitch={onSwitch} />
      <span data-testid="change" className={classNames("area-change", FIGURE, LINE, "flex items-center justify-end text-text", dim)}>
        {row.change}
      </span>
      <span className={classNames(TRACK, "h-3", LINE, dim)}>
        <span className="relative block h-full">
          <TrackMark mark={row.mark} />
        </span>
      </span>
      <span data-testid="running-total" className={classNames("area-total", FIGURE, LINE, "flex min-w-14 items-center justify-end text-text-2", dim)}>
        {row.total}
      </span>
    </>
  );
}

/**
 * One row of the chain: the label, the control where the step is the user's, the change, the track, the running
 * total. The whole row is the target of the pointer, and shows its readout over its middle.
 */
export function LossRow({ row, control, isDimmed, onField, onSwitch }: Props) {
  const { target, bubble, place } = useReadout();
  const dim = isDimmed && "opacity-updating";
  return (
    <div data-testid="loss-row" data-step={row.label} {...target} className={classNames(ROW, row.isTotal && "border-t border-line pt-1.5 first:border-t-0 tablet:pt-0")}>
      {row.isTotal ? <TotalCells row={row} dim={dim} /> : <StepCells row={row} dim={dim} control={control} onField={onField} onSwitch={onSwitch} />}
      <Readout ref={bubble} place={place} words={row.readout} />
    </div>
  );
}
