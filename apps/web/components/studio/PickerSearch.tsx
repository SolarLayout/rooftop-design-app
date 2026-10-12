"use client";

import { classNames } from "@/components/ui/class-names";
import { INPUT_WORDS, WELL } from "@/components/ui/field-look";
import { Icon } from "@/components/ui/Icon";

type Props = {
  value: string;
  /** Hears every key typed: the list follows the words live. */
  onChange: (value: string) => void;
  className?: string;
};

/** The search of the equipment picker: a well with the search icon, the words, and a clear once something is typed. */
export function PickerSearch({ value, onChange, className }: Props) {
  return (
    <div className={classNames("flex h-touch min-w-0 items-center gap-2.5 rounded-control px-3 desktop:h-10", WELL, className)}>
      <Icon name="search" size={16} className="text-text-2" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="Maker or model"
        aria-label="Search the maker or the model"
        className={classNames("grow type-body-touch desktop:type-body", INPUT_WORDS)}
      />
      {value ? (
        <button type="button" aria-label="Clear the search" onClick={() => onChange("")} className="flex cursor-pointer rounded-control text-text-2 hovered:text-text focus-ring">
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </div>
  );
}
