"use client";

import { useId } from "react";
import { classNames } from "./class-names";
import { INPUT, SAID, UNIT, WELL } from "./field-look";
import type { Range } from "./number-entry";
import { useNumberEntry } from "./use-number-entry";

type Props = {
  label: string;
  value: number;
  /** Hears the value once it is committed, and only when it is another than before. */
  onCommit: (value: number) => void;
  range: Range;
  unit?: string;
  /** The label is inside the field, at the left. Otherwise it stands before the field, as in the inspector. */
  labelInside?: boolean;
  disabled?: boolean;
  /** For the kit: the field as it looks with the focus inside. */
  shownAs?: "focus";
  className?: string;
};

export function NumberField({ label, value, onCommit, range, unit, labelInside = false, disabled = false, shownAs, className }: Props) {
  const id = useId();
  const entry = useNumberEntry(value, range, unit, onCommit);
  const names = { label: `${id}-label`, unit: `${id}-unit`, said: `${id}-said` };

  const input = (
    <input
      id={id}
      type="text"
      inputMode={range.decimals === 0 ? "numeric" : "decimal"}
      autoComplete="off"
      value={entry.text}
      disabled={disabled}
      aria-labelledby={names.label}
      aria-describedby={classNames(unit && names.unit, names.said)}
      className={classNames(INPUT, "text-right", labelInside ? "w-16" : "w-12")}
      {...entry.input}
    />
  );
  const unitShown = unit ? (
    <span id={names.unit} className={UNIT}>
      {unit}
    </span>
  ) : null;
  const said = (
    <p id={names.said} role="status" className={classNames(SAID, !labelInside && "text-right")}>
      {entry.said}
    </p>
  );
  const dim = disabled && "opacity-disabled";

  if (labelInside) {
    return (
      <div className={className}>
        <label
          data-testid="well"
          data-shown-as={shownAs}
          className={classNames("flex h-11 items-center gap-2 rounded-control px-3", WELL, dim)}
        >
          <span id={names.label} className="grow text-text-2">
            {label}
          </span>
          {input}
          {unitShown}
        </label>
        {said}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex min-h-10 items-center justify-between gap-row">
        <label id={names.label} htmlFor={id} className="text-text-2">
          {label}
        </label>
        <label
          data-testid="well"
          data-shown-as={shownAs}
          className={classNames(
            "flex h-12 items-center gap-1.5 rounded-row px-3.5 desktop:h-9 desktop:rounded-control desktop:px-3",
            WELL,
            dim,
          )}
        >
          {input}
          {unitShown}
        </label>
      </div>
      {said}
    </div>
  );
}
