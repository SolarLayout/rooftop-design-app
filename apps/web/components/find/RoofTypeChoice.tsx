"use client";

import { useRef, type KeyboardEvent } from "react";
import { SectionHeading } from "@/components/shell/help/SectionHeading";
import { choiceAfterKey } from "@/components/ui/choice-keys";
import { classNames } from "@/components/ui/class-names";
import type { RoofType } from "@/lib/geometry/roof-types";
import { roofTypeChoicesOf } from "@/lib/outline/find-head";

type Props = {
  value: RoofType;
  onChange: (value: RoofType) => void;
  /** The roof's latitude: the rows face the equator of its hemisphere. */
  latitude: number;
};

const ROW = classNames(
  "flex min-h-14 w-full cursor-pointer items-start gap-3 rounded-row border px-3.5 py-2.5 text-left press-motion focus-ring",
  "hovered:border-line-hover",
);

/**
 * The roof type, a question once the outline is closed (V2 · 4, D98): three choices with a line each, tilted rows the
 * default. A group of radio buttons: the keyboard stops at the one taken, the arrows go through them.
 */
export function RoofTypeChoice({ value, onChange, latitude }: Props) {
  const choices = roofTypeChoicesOf(latitude);
  const group = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = choiceAfterKey(
      choices.map(({ id }) => id),
      value,
      event.key,
    );
    if (next === null) return;
    event.preventDefault();
    onChange(next);
    group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[choices.findIndex(({ id }) => id === next)]?.focus();
  }

  return (
    <section aria-label="Roof type" className="flex flex-col gap-row">
      <SectionHeading help="app.section.roof-type" value={value}>
        Roof type
      </SectionHeading>
      <div ref={group} role="radiogroup" aria-label="Roof type" onKeyDown={onKeyDown} className="flex flex-col gap-1.5">
        {choices.map(({ id, name, line, isDefault }) => {
          const isTaken = id === value;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isTaken}
              tabIndex={isTaken ? 0 : -1}
              onClick={() => onChange(id)}
              className={classNames(ROW, isTaken ? "border-line-strong bg-surface-2" : "border-transparent")}
            >
              <span aria-hidden="true" className={classNames("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", isTaken ? "border-accent" : "border-line-strong")}>
                {isTaken ? <span className="size-2 rounded-full bg-accent" /> : null}
              </span>
              <span className="flex grow flex-col gap-0.5">
                <span className="font-medium">{name}</span>
                <span className="type-body-touch text-text-2 desktop:type-body">{line}</span>
              </span>
              {isDefault ? <span className="shrink-0 type-unit text-text-3">Default</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
