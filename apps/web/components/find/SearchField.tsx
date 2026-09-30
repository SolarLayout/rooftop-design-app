"use client";

import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Enter was pressed with what is typed. */
  onSubmit: (value: string) => void;
  /** What stands at the right of the field: the label of the place found, a ring while searching. */
  beside?: React.ReactNode;
  className?: string;
};

export const SEARCH_LABEL = "Search an address or paste coordinates";

const BOX = "flex h-12 min-w-0 items-center gap-3 rounded-card-s border border-line bg-surface-1 px-4 shadow-float";

/** The field of the search: words, coordinates or a maps link. */
export function SearchField({ value, onChange, onSubmit, beside, className }: Props) {
  return (
    <form
      role="search"
      className={classNames(BOX, className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <Icon name="search" size={18} className="text-text-2" />
      <input
        type="text"
        aria-label={SEARCH_LABEL}
        placeholder={SEARCH_LABEL}
        autoComplete="off"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 grow border-0 bg-transparent text-text outline-none placeholder:text-text-3 type-body-touch desktop:type-body"
      />
      {beside}
    </form>
  );
}
