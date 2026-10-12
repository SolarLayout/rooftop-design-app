"use client";

import { useId } from "react";
import { classNames } from "./class-names";
import { INPUT_WORDS, SAID, WELL } from "./field-look";
import type { TextRules } from "./text-entry";
import { useTextEntry } from "./use-text-entry";

type Props = TextRules & {
  label: string;
  value: string;
  /** Hears the value once it is committed, and only when it is another than before. */
  onCommit: (value: string) => void;
  /** Hears the draft as it is typed, and null when it is gone: for what follows the words live. */
  onDraft?: (draft: string | null) => void;
  /** Hears every commit, with what the field says of it: null when the entry stood. For a field shown for one entry. */
  onDone?: (said: string | null) => void;
  /** The label is for the screen reader alone: the row around the field names it. */
  labelHidden?: boolean;
  /** A line under the field, in the style of what it says: what the words are for. */
  detail?: string | null;
  placeholder?: string;
  disabled?: boolean;
  /** For the kit: the field as it looks with the focus inside. */
  shownAs?: "focus";
  /** The focus goes into this field when it is shown: it is the one to answer. */
  initialFocus?: boolean;
  className?: string;
};

// The label before the field, 72 wide; what is said under the field starts under the field from tablet up.
const LABEL = "w-18 shrink-0 text-text";
const UNDER = "tablet:pl-21";

/** The number field's well for words (docs/design/components.md, "Text field"). */
export function TextField({ label, value, onCommit, onDraft, onDone, maxLength, needed, labelHidden = false, detail = null, placeholder, disabled = false, shownAs, initialFocus, className }: Props) {
  const id = useId();
  const names = { said: `${id}-said`, detail: `${id}-detail` };
  const entry = useTextEntry(value, { maxLength, needed }, onCommit, onDraft, onDone);
  const under = labelHidden ? undefined : UNDER;

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <label htmlFor={id} className={labelHidden ? "sr-only" : LABEL}>
          {label}
        </label>
        <span
          data-testid="well"
          data-shown-as={shownAs}
          className={classNames("flex h-touch min-w-0 grow items-center rounded-control px-3 desktop:h-10", WELL, disabled && "opacity-disabled")}
        >
          <input
            id={id}
            type="text"
            autoComplete="off"
            value={entry.text}
            maxLength={maxLength}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={initialFocus}
            data-initial-focus={initialFocus || undefined}
            aria-describedby={classNames(names.said, detail && names.detail)}
            className={classNames(INPUT_WORDS, "w-full grow")}
            {...entry.input}
          />
        </span>
      </div>
      <p id={names.said} role="status" className={classNames(SAID, under)}>
        {entry.said}
      </p>
      {detail && entry.said === null ? (
        <p id={names.detail} className={classNames("mt-1.5 type-body-touch desktop:type-body text-text-2", under)}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}
