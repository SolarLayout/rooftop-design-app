"use client";

import type { ComponentProps } from "react";
import { classNames } from "./class-names";

type Props = Omit<ComponentProps<"button">, "children" | "onChange" | "role" | "aria-checked" | "aria-label"> & {
  /** What the switch turns on, in words. It is the name of the switch. */
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
};

// On phone and tablet the switch is larger and sits in a target of 52 by 44.
const TARGET = "h-touch w-13 desktop:h-6.5 desktop:w-11";
const TRACK = "h-7.5 w-13 p-0.75 desktop:h-6.5 desktop:w-11";
const KNOB = "size-6 desktop:size-5";
const KNOB_ON = "translate-x-5.5 desktop:translate-x-4.5";

/** On or off, at once. It stands beside its label and, where it helps, one line of hint. */
export function Switch({ label, on, onChange, type = "button", className, ...rest }: Props) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={classNames(
        "inline-flex shrink-0 cursor-pointer items-center rounded-full focus-ring",
        "disabled:cursor-default disabled:opacity-disabled",
        TARGET,
        className,
      )}
      {...rest}
    >
      <span
        data-testid="track"
        className={classNames("flex rounded-full shadow-track press-motion", TRACK, on ? "bg-accent" : "bg-line-strong")}
      >
        <span
          data-testid="knob"
          className={classNames(
            "rounded-full shadow-knob press-motion",
            KNOB,
            on ? classNames("bg-accent-ink", KNOB_ON) : "bg-text-2",
          )}
        />
      </span>
    </button>
  );
}
