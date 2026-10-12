"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { classNames } from "./class-names";
import { LIST_GAP } from "./design-numbers";
import { FloatingPanel } from "./FloatingPanel";
import { Icon } from "./Icon";
import { indexAfterKey, indexOfTyped } from "./list-keys";
import { FACT, LIST, ROW, ROW_MARKED } from "./list-look";
import { ProgressRing } from "./ProgressRing";
import { StatusMark } from "./StatusMark";
import type { Mark } from "./table-cells";
import { useFloating } from "./use-floating";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  /** One fact about the choice, at its right: "Typical year". */
  fact?: string;
  /** A tick or a note after the choice: the verdict of a stringing option. In the trigger too, when taken. */
  mark?: Mark;
  /** A choice that is shown and cannot be taken. */
  disabled?: boolean;
};

// Letters typed shortly after each other are one word; after this long a new one begins.
const TYPED_TOGETHER = 600;

const TRIGGER = classNames(
  "inline-flex h-touch shrink-0 cursor-pointer items-center gap-2 rounded-control border px-3.5 whitespace-nowrap select-none",
  "press-motion focus-ring desktop:h-10",
  "disabled:cursor-default disabled:opacity-disabled disabled:flat",
);
const TRIGGER_CLOSED = classNames(
  "border-line bg-control shadow-raised",
  "hovered:raised-by-hover hovered:border-line-hover hovered:bg-control-hover hovered:shadow-raised-hover",
  "pressed:lowered-by-press pressed:border-line-strong pressed:bg-control-pressed pressed:shadow-pressed",
);
const TRIGGER_OPEN = "border-line-strong bg-control-pressed shadow-pressed";

type TriggerProps = Omit<ComponentProps<"button">, "children" | "value"> & {
  label: string;
  /** The choice that is taken, in words. */
  value: string;
  /** The mark of the choice that is taken, after its words. */
  mark?: Mark;
  open: boolean;
  /** What was chosen is being loaded: a turning ring stands where the chevron was. */
  busy?: boolean;
};

/** What opens the list: the label, the choice that is taken, its mark where it has one, a chevron; a turning ring while busy. */
export function SelectTrigger({ label, value, mark, open, busy = false, className, ...rest }: TriggerProps) {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      className={classNames(TRIGGER, open ? TRIGGER_OPEN : TRIGGER_CLOSED, className)}
      {...rest}
    >
      <span className="text-text-2">{label}</span>
      <span className="min-w-0 truncate font-medium">{value}</span>
      {mark ? <StatusMark kind={mark.kind} label={mark.label} wordsShown={false} size={16} /> : null}
      {busy ? <ProgressRing size={16} className="ml-auto" /> : <Icon name={open ? "chevron-up" : "chevron-down"} size={16} className="ml-auto text-text-3" />}
    </button>
  );
}

type ListProps<T extends string> = Omit<ComponentProps<"ul">, "children" | "onChange"> & {
  /** What is chosen here, in words: the name of the list. */
  label: string;
  options: ReadonlyArray<SelectOption<T>>;
  value: T;
  /** The row under the pointer or the keyboard. */
  marked: number | null;
  /** The name of a row in the page, by its place in the list. */
  idOf: (index: number) => string;
  onMark?: (index: number) => void;
  onTake?: (value: T) => void;
};

/** The choices, of which one is taken. */
export function OptionList<T extends string>({ label, options, value, marked, idOf, onMark, onTake, className, ...rest }: ListProps<T>) {
  return (
    <ul
      role="listbox"
      aria-label={label}
      aria-activedescendant={marked === null ? undefined : idOf(marked)}
      className={classNames(LIST, "outline-none", className)}
      {...rest}
    >
      {options.map((option, index) => (
        <li
          key={option.value}
          id={idOf(index)}
          role="option"
          aria-selected={option.value === value}
          aria-disabled={option.disabled || undefined}
          onPointerMove={() => !option.disabled && onMark?.(index)}
          onClick={() => !option.disabled && onTake?.(option.value)}
          className={classNames(ROW, index === marked && ROW_MARKED, option.disabled && "cursor-default opacity-disabled")}
        >
          {option.value === value ? (
            <span data-testid="taken" className="flex text-accent">
              <Icon name="tick" stroke="tick" size={16} />
            </span>
          ) : (
            <span className="size-4 shrink-0" />
          )}
          <span className={classNames("grow", option.value === value && "font-medium")}>{option.label}</span>
          {option.mark ? <StatusMark kind={option.mark.kind} label={option.mark.label} wordsShown={false} size={16} /> : null}
          {option.fact ? <span className={FACT}>{option.fact}</span> : null}
        </li>
      ))}
    </ul>
  );
}

type Props<T extends string> = {
  /** What is chosen here, in words. It stands in the trigger, before the choice that is taken. */
  label: string;
  options: ReadonlyArray<SelectOption<T>>;
  value: T;
  /** Hears a choice once it is taken, and only when it is another than before. */
  onChange: (value: T) => void;
  disabled?: boolean;
  /** The words of the trigger where they are not the label of the choice that is taken: the name of the CSV file that is the weather. */
  valueShown?: string;
  /** What was chosen is being loaded: the trigger says it with a turning ring, and the list does not open until it is over. */
  busy?: boolean;
  className?: string;
};

/** One of several choices, of which each may need more than a word. For two to four short ones there is Segmented. */
export function Select<T extends string>({ label, options, value, onChange, disabled = false, valueShown, busy = false, className }: Props<T>) {
  const id = useId();
  const [floating, trigger] = useFloating({ side: "below", align: "start", gap: LIST_GAP });
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ letters: "", at: 0 });
  const [marked, setMarked] = useState<number | null>(null);

  const taken = options.findIndex((option) => option.value === value);
  const unavailable = new Set(options.flatMap((option, index) => (option.disabled ? [index] : [])));

  function open() {
    if (busy) return;
    setMarked(taken === -1 ? null : taken);
    floating.open();
    list.current?.focus();
  }

  function take(next: T) {
    floating.closeAndGoBack();
    if (next !== value) onChange(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = marked === null ? undefined : options[marked];
      if (option && !option.disabled) take(option.value);
      return;
    }
    if (event.key === "Tab") {
      floating.close();
      return;
    }

    let to = indexAfterKey(options.length, marked, event.key, unavailable);
    const isLetter = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (isLetter) {
      const letters = event.timeStamp - typed.current.at < TYPED_TOGETHER ? typed.current.letters + event.key : event.key;
      typed.current = { letters, at: event.timeStamp };
      to = indexOfTyped(options.map((option) => option.label), letters, marked, unavailable);
    }
    // A key of the list that leads nowhere must not scroll the page either.
    if (to !== null || ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) event.preventDefault();
    if (to !== null) setMarked(to);
  }

  return (
    <>
      <SelectTrigger
        ref={trigger}
        label={label}
        value={valueShown ?? options[taken]?.label ?? ""}
        mark={options[taken]?.mark}
        open={floating.isOpen}
        busy={busy}
        disabled={disabled}
        aria-controls={id}
        className={className}
        onClick={() => (floating.isOpen ? floating.close() : open())}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          open();
        }}
      />
      <FloatingPanel floating={floating}>
        <OptionList
          ref={list}
          id={id}
          tabIndex={-1}
          label={label}
          options={options}
          value={value}
          marked={marked}
          idOf={(index) => `${id}-${index}`}
          onMark={setMarked}
          onTake={take}
          onKeyDown={onKeyDown}
        />
      </FloatingPanel>
    </>
  );
}
