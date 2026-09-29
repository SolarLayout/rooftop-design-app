import type { ComponentProps, ReactNode } from "react";
import { classNames } from "./class-names";

/** Cell: one of the vitals. Lead: the first of them, the energy. Tile: a value inside a card. */
export type StatLook = "cell" | "lead" | "tile";

const FRAME: Record<StatLook, string> = {
  cell: "gap-1",
  lead: "gap-0.5",
  tile: "gap-0.5 rounded-row bg-surface-2 px-3.5 py-2.5",
};

const VALUE: Record<StatLook, string> = {
  cell: "type-value tablet:type-value-l desktop:type-value",
  lead: "type-number-vital-touch tablet:type-number-vital",
  tile: "type-value",
};

const UNIT: Record<StatLook, string> = {
  cell: "type-caption",
  lead: "type-caption tablet:type-small",
  tile: "type-caption",
};

type Props = {
  label: string;
  /** The value as it is shown: the number is formatted by who knows the quantity. */
  value: string;
  unit?: string;
  /** What follows the value: a status mark. */
  mark?: ReactNode;
  look?: StatLook;
  className?: string;
};

/** One label with its value. It belongs into `Stats`. */
export function Stat({ label, value, unit, mark, look = "cell", className }: Props) {
  return (
    <div className={classNames("flex min-w-0 flex-col justify-center whitespace-nowrap", FRAME[look], className)}>
      <dt className="type-caption text-text-2">{label}</dt>
      <dd className={classNames("flex items-center gap-1.5 text-text", VALUE[look])}>
        <span>
          {value}
          {/* The space is as wide as a figure of the value: it is outside the unit. */}
          {unit ? " " : null}
          {unit ? <span className={classNames("text-text-2", UNIT[look])}>{unit}</span> : null}
        </span>
        {mark}
      </dd>
    </div>
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
