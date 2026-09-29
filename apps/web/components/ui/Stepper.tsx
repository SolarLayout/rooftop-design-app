"use client";

import { useId } from "react";
import { classNames } from "./class-names";
import { INPUT, SAID, WELL } from "./field-look";
import { Icon, type IconName } from "./Icon";
import { stepped, type Range } from "./number-entry";
import { useNumberEntry } from "./use-number-entry";

type Props = {
  label: string;
  value: number;
  /** Hears the value once it is committed, and only when it is another than before. */
  onCommit: (value: number) => void;
  /** The range has both ends: the buttons stop at them. */
  range: Range & { min: number; max: number };
  /** The names of the two buttons. */
  fewer?: string;
  more?: string;
  disabled?: boolean;
  className?: string;
};

const BUTTON = classNames(
  "inline-flex size-touch shrink-0 cursor-pointer items-center justify-center rounded-seg-touch bg-transparent text-text-2",
  "press-motion focus-ring hovered:bg-surface-2 hovered:text-text pressed:lowered-by-press",
  "desktop:size-7.5 desktop:rounded-seg",
  "disabled:cursor-default disabled:opacity-disabled",
);

/** A number field for a few whole steps, between a minus and a plus. A press on either commits at once. */
export function Stepper({ label, value, onCommit, range, fewer = "Fewer", more = "More", disabled = false, className }: Props) {
  const id = useId();
  const entry = useNumberEntry(value, range, undefined, onCommit);
  const names = { label: `${id}-label`, said: `${id}-said` };

  const button = (name: string, icon: IconName, direction: "up" | "down", atTheEnd: boolean) => (
    <button
      type="button"
      aria-label={name}
      disabled={disabled || atTheEnd}
      onClick={() => entry.commit(stepped(value, direction, range))}
      className={BUTTON}
    >
      <Icon name={icon} size={14} />
    </button>
  );

  return (
    <div className={className}>
      <div className="flex min-h-10 items-center justify-between gap-row">
        <label id={names.label} htmlFor={id} className="text-text-2">
          {label}
        </label>
        <div
          data-testid="well"
          className={classNames("flex items-center gap-0.5 rounded-row p-0.75 desktop:rounded-control", WELL, disabled && "opacity-disabled")}
        >
          {button(fewer, "minus", "down", value <= range.min)}
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={entry.text}
            disabled={disabled}
            aria-labelledby={names.label}
            aria-describedby={names.said}
            className={classNames(INPUT, "h-touch w-9 text-center desktop:h-7.5")}
            {...entry.input}
          />
          {button(more, "plus", "up", value >= range.max)}
        </div>
      </div>
      <p id={names.said} role="status" className={classNames(SAID, "text-right")}>
        {entry.said}
      </p>
    </div>
  );
}
