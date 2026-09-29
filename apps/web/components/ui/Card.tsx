import type { ComponentProps } from "react";
import { classNames } from "./class-names";

type Props = ComponentProps<"div"> & {
  /** Smaller corners and less padding, for a card among many. */
  compact?: boolean;
  /** The one of several that is chosen. */
  selected?: boolean;
};

export function Card({ compact = false, selected = false, className, children, ...rest }: Props) {
  return (
    <div
      className={classNames(
        "border",
        compact ? "rounded-card-s p-card-compact" : "rounded-card p-card",
        selected ? "border-accent bg-note-surface shadow-halo-selected" : "border-line bg-surface-1 shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
