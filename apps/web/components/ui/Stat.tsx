import type { ComponentProps, ReactNode } from "react";
import { classNames } from "./class-names";

/**
 * Cell: one of the vitals. Lead: the first of them, the energy. Tile: a value inside a card. Hero: the energy on
 * Performance, at the display size of 76. Figure: a KPI tile of Performance, a card of its own.
 */
export type StatLook = "cell" | "lead" | "tile" | "hero" | "figure";

const FRAME: Record<StatLook, string> = {
  cell: "gap-1",
  lead: "gap-0.5",
  tile: "gap-0.5 rounded-row bg-surface-2 px-3.5 py-2.5",
  hero: "gap-0.5",
  figure: "gap-1 tablet:gap-1.5",
};

const LABEL: Record<StatLook, string> = {
  cell: "type-caption",
  lead: "type-caption",
  tile: "type-caption",
  hero: "type-small tablet:type-body-touch desktop:type-body",
  figure: "type-small tablet:type-body-touch desktop:type-body",
};

const VALUE: Record<StatLook, string> = {
  cell: "type-value tablet:type-value-l desktop:type-value",
  lead: "type-number-vital-touch tablet:type-number-vital",
  tile: "type-value",
  hero: "type-number-hero",
  figure: "type-number-vital tablet:type-number-tile",
};

const UNIT: Record<StatLook, string> = {
  cell: "type-caption",
  lead: "type-caption tablet:type-small",
  tile: "type-caption",
  hero: "type-unit-hero",
  figure: "type-small tablet:type-body",
};

type Props = Omit<ComponentProps<"div">, "children"> & {
  label: string;
  /** The value as it is shown: the number is formatted by who knows the quantity. */
  value: string;
  /**
   * The widest value this stat will show, while its value counts toward it (Present's energy): the value stands in that
   * width from the start, at its right, in tabular figures, so that it neither wiggles nor pushes what is beside it.
   */
  holds?: string;
  unit?: string;
  /** What follows the unit, quieter and never dimmed: the DC side of the capacity factor. On phone it takes a line under the value. */
  more?: string;
  /** What follows the value: a status mark. */
  mark?: ReactNode;
  /** The value is of before, and a new one is on its way: it stays, dimmed. */
  dimmed?: boolean;
  /** What stands beside the value and is never dimmed: the ring of a value that is updated. */
  beside?: ReactNode;
  look?: StatLook;
};

const BESIDE: Record<StatLook, string> = { cell: "gap-1.5", lead: "gap-2.5", tile: "gap-1.5", hero: "gap-3.5", figure: "gap-1.5" };

/** One label with its value. It belongs into `Stats`. */
export function Stat({ label, value, holds, unit, more, mark, dimmed = false, beside, look = "cell", className, ...rest }: Props) {
  return (
    <div className={classNames("flex min-w-0 flex-col justify-center whitespace-nowrap", FRAME[look], className)} {...rest}>
      <dt className={classNames("text-text-2", LABEL[look])}>{label}</dt>
      <dd className={classNames("flex items-center text-text", more && "flex-wrap", BESIDE[look], VALUE[look])}>
        <span data-testid="stat-value" className={classNames("flex items-center gap-1.5", dimmed && "opacity-updating")}>
          <span>
            {holds === undefined ? value : <HeldValue value={value} holds={holds} />}
            {/* The space is as wide as a figure of the value: it is outside the unit. */}
            {unit ? " " : null}
            {/* Dimmed, the unit has the colour of the number: in its own it could not be read any more. */}
            {unit ? <span className={classNames(dimmed ? "text-text" : "text-text-2", UNIT[look])}>{unit}</span> : null}
          </span>
          {mark}
        </span>
        {beside}
        {more ? <span className={classNames("hidden text-text-2 tablet:inline", UNIT[look])}>· {more}</span> : null}
        {more ? <span className="basis-full type-caption text-text-2 tablet:hidden">{more}</span> : null}
      </dd>
    </div>
  );
}

/**
 * A value in the width of the one it holds the place of: the held one in the flow, unseen, gives the width; the value
 * stands over it at its right. (An inline grid of the two took no width inside the stat's flex boxes.)
 */
function HeldValue({ value, holds }: { value: string; holds: string }) {
  return (
    <span className="relative inline-block tabular-nums">
      <span aria-hidden className="invisible">
        {holds}
      </span>
      <span className="absolute top-0 right-0">{value}</span>
    </span>
  );
}

/** A list of stats. */
export function Stats({ className, children, ...rest }: ComponentProps<"dl">) {
  return (
    <dl className={className} {...rest}>
      {children}
    </dl>
  );
}
