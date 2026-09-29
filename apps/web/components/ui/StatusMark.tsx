import { classNames } from "./class-names";
import { Icon, type IconSize } from "./Icon";

/** A result fits, or it has a note. There is no third kind: no cross, no red. */
export type StatusKind = "fits" | "note";

type Props = {
  kind: StatusKind;
  /** The words of the mark: "Fits", "Below the DC/AC target". */
  label: string;
  /** False where there is no room for the words: the mark then says them to a screen reader. */
  wordsShown?: boolean;
  size?: IconSize;
  className?: string;
};

export function StatusMark({ kind, label, wordsShown = true, size = 18, className }: Props) {
  const colour = kind === "fits" ? "text-ok" : "text-accent";
  const mark = (
    <Icon
      name={kind === "fits" ? "tick" : "note"}
      stroke={kind === "fits" ? "tick" : "icon"}
      size={size}
      label={wordsShown ? undefined : label}
      className={classNames(colour, !wordsShown && className)}
    />
  );
  if (!wordsShown) return mark;

  return (
    <span className={classNames("inline-flex items-center gap-inline", className)}>
      {mark}
      {label}
    </span>
  );
}
