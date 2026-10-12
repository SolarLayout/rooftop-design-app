"use client";

import { useRef, type KeyboardEvent } from "react";
import { choiceAfterKey } from "./choice-keys";
import { classNames } from "./class-names";
import { StatusMark } from "./StatusMark";
import type { Mark } from "./table-cells";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** What the choice is called to a screen reader, where the label alone says too little ("3D": "3D view"). */
  name?: string;
  /** A choice that is shown and cannot be taken. */
  disabled?: boolean;
  /** A tick or a note after the label: the verdict of a stringing option. Its words go into `name`. */
  mark?: Mark;
};

type Props<T extends string> = {
  /** What is chosen here, in words: the name of the group. */
  label: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  /**
   * The choice that is taken. There is one, as a rule: a choice that only the user can make is asked for
   * with a decision card, never with a segmented control of which nothing is taken. Null only while the
   * control cannot be used, where the choice does not apply yet (the units of a drawing before it is a DXF).
   */
  value: T | null;
  onChange: (value: T) => void;
  /** The choices share the width in equal parts. */
  fill?: boolean;
  /** The control is shown and cannot be used: dim, and neither pointer nor key takes a choice. */
  disabled?: boolean;
  className?: string;
};

const TRACK = "gap-0.5 rounded-row border border-line bg-well p-1 shadow-well";

const ITEM = classNames(
  "inline-flex h-touch cursor-pointer items-center justify-center gap-1.5 rounded-control px-3.5 whitespace-nowrap select-none",
  "type-body-touch desktop:type-body press-motion focus-ring",
  "desktop:h-8 type-body-touch desktop:type-body",
  "disabled:cursor-default disabled:opacity-disabled",
);
// The weight is said again for desktop: the type style of desktop, which comes later, sets one too.
const TAKEN = "bg-control-active font-medium text-text shadow-segment desktop:font-medium";
const NOT_TAKEN = "bg-transparent text-text-2 hovered:text-text";

/** Two to four choices with short names, of which one is taken. */
export function Segmented<T extends string>({ label, options, value, onChange, fill = false, disabled = false, className }: Props<T>) {
  const group = useRef<HTMLDivElement>(null);
  // The keyboard stops at the choice that is taken; where none is, at the first.
  const stopAt = value ?? options[0]?.value;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const unavailable = new Set(options.filter((option) => option.disabled).map((option) => option.value));
    const values = options.map((option) => option.value);
    // With nothing taken, the first key takes the choice the keyboard stands at.
    const next = value === null ? (choiceAfterKey(values, stopAt, event.key, unavailable) === null ? null : stopAt) : choiceAfterKey(values, value, event.key, unavailable);
    if (next === null) return;

    event.preventDefault();
    onChange(next);
    group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[values.indexOf(next)]?.focus();
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={classNames(fill ? "grid auto-cols-fr grid-flow-col" : "inline-flex", TRACK, disabled && "opacity-disabled", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.name}
          tabIndex={option.value === stopAt ? 0 : -1}
          disabled={option.disabled}
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (!disabled) onChange(option.value);
          }}
          className={classNames(ITEM, option.value === value ? TAKEN : NOT_TAKEN)}
        >
          {option.label}
          {option.mark ? <StatusMark kind={option.mark.kind} label={option.mark.label} wordsShown={false} size={14} /> : null}
        </button>
      ))}
    </div>
  );
}
