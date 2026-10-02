"use client";

import { useId } from "react";
import { classNames } from "./class-names";
import { INPUT, INPUT_IN_THE_CHAIN, SAID, UNIT, WELL } from "./field-look";
import type { Range } from "./number-entry";
import { useNumberEntry } from "./use-number-entry";

type Props = {
  label: string;
  /** Null for a field that has no value yet: it is empty until a number is typed. */
  value: number | null;
  /** Hears the value once it is committed, and only when it is another than before. */
  onCommit: (value: number) => void;
  range: Range;
  unit?: string;
  /** The label is inside the field, at the left. Otherwise it stands before the field, as in the inspector. */
  labelInside?: boolean;
  /** The label is for the screen reader alone: the eye has a column heading. With the label inside. */
  labelHidden?: boolean;
  /** Room for a long number, such as a coordinate with five decimals. With the label inside. */
  wide?: boolean;
  disabled?: boolean;
  /** For the kit: the field as it looks with the focus inside. */
  shownAs?: "focus";
  /** A line under the label, where the label stands before the field: where the value comes from ("11.9 °C from the weather"). */
  detail?: string | null;
  /** In a dialog, the focus goes into this field when it opens: it is the one to answer. */
  initialFocus?: boolean;
  /**
   * Inside the loss chain (components.md, "Number field"): 22 high on desktop, 40 on tablet, 44 on phone, the label
   * for the screen reader alone, since the row's label is seen. The well is a cell of the row's grid (`area-field`),
   * and what the field says stands in the line under the row (`area-said`).
   */
  form?: "chain";
  /** Empty for its default, the field says the default inside itself ("PAN 0.2 %"). Inside the loss chain. */
  placeholder?: string;
  className?: string;
};

const CHAIN_WELL = "flex h-touch w-28 items-center gap-1 rounded-control px-3 tablet:h-10 tablet:w-full tablet:rounded-xs tablet:px-2 desktop:h-5.5";

export function NumberField({ label, value, onCommit, range, unit, labelInside = false, labelHidden = false, wide = false, disabled = false, detail = null, shownAs, initialFocus, form, placeholder, className }: Props) {
  const id = useId();
  const entry = useNumberEntry(value, range, unit, onCommit);
  const names = { label: `${id}-label`, unit: `${id}-unit`, said: `${id}-said`, detail: `${id}-detail` };
  const inChain = form === "chain";

  const input = (
    <input
      id={id}
      type="text"
      inputMode={range.decimals === 0 ? "numeric" : "decimal"}
      autoComplete="off"
      value={entry.text}
      disabled={disabled}
      placeholder={placeholder}
      data-initial-focus={initialFocus || undefined}
      aria-labelledby={names.label}
      aria-describedby={classNames(unit && names.unit, detail && !labelInside && names.detail, names.said)}
      className={classNames(inChain ? INPUT_IN_THE_CHAIN : INPUT, "text-right", labelHidden || inChain ? "w-full grow" : wide ? "w-24" : "w-16")}
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

  if (inChain) {
    return (
      <div className="contents">
        <label data-testid="well" data-shown-as={shownAs} className={classNames("area-field", CHAIN_WELL, WELL, dim, className)}>
          <span id={names.label} className="sr-only">
            {label}
          </span>
          {input}
          {unitShown}
        </label>
        <p id={names.said} role="status" className={classNames(SAID, "area-said")}>
          {entry.said}
        </p>
      </div>
    );
  }

  if (labelInside) {
    return (
      <div className={className}>
        <label
          data-testid="well"
          data-shown-as={shownAs}
          className={classNames("flex h-11 items-center gap-2 rounded-control px-3", WELL, dim)}
        >
          <span id={names.label} className={labelHidden ? "sr-only" : "grow whitespace-nowrap text-text-2"}>
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
        {detail ? (
          <span className="flex min-w-0 flex-col gap-0.5">
            <label id={names.label} htmlFor={id} className="text-text-2">
              {label}
            </label>
            <span id={names.detail} className="type-caption text-text-3">
              {detail}
            </span>
          </span>
        ) : (
          <label id={names.label} htmlFor={id} className="text-text-2">
            {label}
          </label>
        )}
        <label
          data-testid="well"
          data-shown-as={shownAs}
          className={classNames(
            // On touch the wells of a column are all as wide, whatever their unit (the board "Studio, Roof lens, phone").
            "flex h-12 w-33 items-center justify-end gap-1.5 rounded-row px-3.5 desktop:h-9 desktop:w-auto desktop:justify-start desktop:rounded-control desktop:px-3",
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
