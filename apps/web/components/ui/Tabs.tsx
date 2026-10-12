"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";
import { choiceAfterKey } from "./choice-keys";
import { classNames } from "./class-names";
import type { ShownAs } from "./shown-as";

export type TabOption<T extends string> = {
  value: T;
  label: string;
  /** How many there are of what the tab holds. */
  count?: number;
  /** A tab that is shown and cannot be taken. */
  disabled?: boolean;
};

/** The row in the line of a title: the title, and what stands after the row (a unit, a field). */
export type TabsHead = { title: ReactNode; aside?: ReactNode };

type Props<T extends string> = {
  /** What the tabs divide, in words: the name of the row. */
  label: string;
  /**
   * The row stands in the line of a title: on desktop at the right of it, with `aside` after the row; on phone and
   * tablet the title's line holds `aside`, and the row stands under it across the width (the chart cards of Performance).
   */
  head?: TabsHead;
  tabs: ReadonlyArray<TabOption<T>>;
  /** The tab that is taken. There is always one. */
  value: T;
  onChange: (value: T) => void;
  /** The panel of the tab that is taken. */
  children: ReactNode;
  /** For the kit: tabs as they look in a state, without a pointer or a keyboard. */
  shownAs?: Partial<Record<T, ShownAs>>;
  className?: string;
};

// The keys of a row that lies: up and down are left to the page.
const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

const TAB = classNames(
  "flex h-touch shrink-0 cursor-pointer items-center rounded-control bg-transparent px-4 whitespace-nowrap select-none",
  "type-body-touch desktop:type-body press-motion focus-ring desktop:h-10 desktop:px-3.5",
  "disabled:cursor-default disabled:opacity-disabled",
);
// The weight is said again for desktop: the type style of desktop, which comes later, sets one too.
const TAKEN = "font-medium text-text desktop:font-medium";
const NOT_TAKEN = "text-text-2 hovered:text-text";

// The line under a tab is as wide as its words, and lies on the line of the row.
const LINE = "-mb-px flex items-center gap-1.5 self-stretch border-b-tab";

const COUNT = "flex h-4.5 items-center rounded-full bg-surface-2 px-1.5 type-unit text-text-2";

/** Parts of one card or one panel, of which one is shown. */
export function Tabs<T extends string>({ label, head, tabs, value, onChange, children, shownAs, className }: Props<T>) {
  const id = useId();
  const tabOf = (tab: T) => `${id}-tab-${tab}`;
  const panel = `${id}-panel`;

  function take(next: T, row: HTMLElement) {
    onChange(next);
    const tab = row.querySelector<HTMLElement>(`[id="${tabOf(next)}"]`);
    tab?.focus();
    tab?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!KEYS.has(event.key)) return;
    const unavailable = new Set(tabs.filter((tab) => tab.disabled).map((tab) => tab.value));
    const next = choiceAfterKey(
      tabs.map((tab) => tab.value),
      value,
      event.key,
      unavailable,
    );
    if (next === null) return;

    event.preventDefault();
    take(next, event.currentTarget);
  }

  const row = (
    <div data-testid="tabs-line" className={classNames("border-b border-line", head && "order-3 basis-full desktop:order-2 desktop:basis-auto")}>
        {/* Room around the row, so that the ring of a tab is not cut off where the row scrolls. */}
        <div data-testid="tabs-scroller" className="-mx-1 -mt-1 -mb-1 overflow-x-auto px-1 pt-1 pb-1 no-scrollbar">
          <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1">
            {tabs.map((tab) => {
              const isTaken = tab.value === value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  id={tabOf(tab.value)}
                  aria-selected={isTaken}
                  aria-controls={isTaken ? panel : undefined}
                  tabIndex={isTaken ? 0 : -1}
                  disabled={tab.disabled}
                  data-shown-as={shownAs?.[tab.value]}
                  onClick={(event) => {
                    const row = event.currentTarget.parentElement;
                    if (row && !isTaken) take(tab.value, row);
                  }}
                  className={classNames(TAB, isTaken ? TAKEN : NOT_TAKEN)}
                >
                  <span
                    data-testid="tab-line"
                    className={classNames(LINE, isTaken ? "border-accent" : "border-transparent within-hovered:border-line-hover")}
                  >
                    {tab.label}
                    {tab.count === undefined ? null : <span className={COUNT}>{tab.count}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
  );

  return (
    <div className={className}>
      {head ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
          <div className="grow">{head.title}</div>
          {head.aside ? <div className="order-2 desktop:order-3">{head.aside}</div> : null}
          {row}
        </div>
      ) : (
        row
      )}
      <div role="tabpanel" id={panel} aria-labelledby={tabOf(value)} tabIndex={0} className="mt-4 rounded-control focus-ring">
        {children}
      </div>
    </div>
  );
}
