"use client";

import { useRef, type KeyboardEvent } from "react";
import { choiceAfterKey } from "./choice-keys";
import { classNames } from "./class-names";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** A choice that is shown and cannot be taken. */
  disabled?: boolean;
};

type Props<T extends string> = {
  /** What is chosen here, in words: the name of the group. */
  label: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  /**
   * The choice that is taken. There is always one: a choice that only the user can make is asked for
   * with a decision card, never with a segmented control of which nothing is taken.
   */
  value: T;
  onChange: (value: T) => void;
  /** The choices share the width in equal parts. */
  fill?: boolean;
  className?: string;
};

const TRACK = "gap-0.5 rounded-row border border-line bg-well p-0.75 shadow-well desktop:rounded-control";

const ITEM = classNames(
  "h-touch cursor-pointer rounded-seg-touch px-3.5 whitespace-nowrap select-none",
  "type-body press-motion focus-ring",
  "desktop:h-7.5 desktop:rounded-seg desktop:type-small",
  "disabled:cursor-default disabled:opacity-disabled",
);
// The weight is said again for desktop: the type style of desktop, which comes later, sets one too.
const TAKEN = "bg-control-active font-medium text-text shadow-segment desktop:font-medium";
const NOT_TAKEN = "bg-transparent text-text-2 hovered:text-text";

/** Two to four choices with short names, of which one is taken. */
export function Segmented<T extends string>({ label, options, value, onChange, fill = false, className }: Props<T>) {
  const group = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const unavailable = new Set(options.filter((option) => option.disabled).map((option) => option.value));
    const values = options.map((option) => option.value);
    const next = choiceAfterKey(values, value, event.key, unavailable);
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
      onKeyDown={onKeyDown}
      className={classNames(fill ? "grid auto-cols-fr grid-flow-col" : "inline-flex", TRACK, className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={classNames(ITEM, option.value === value ? TAKEN : NOT_TAKEN)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
