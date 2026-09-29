import { classNames } from "./class-names";

/** What the block stands for: the label of a value, a value, the lead value, a line of text. */
export type SkeletonKind = "label" | "value" | "lead" | "text";

type Props = {
  kind: SkeletonKind;
  /** How wide the block is: a width of its own for each, so that they look like what they stand for. */
  className: string;
};

const HEIGHT: Record<SkeletonKind, string> = { label: "h-2.5", value: "h-4.5", lead: "h-5.5", text: "h-3" };

/**
 * In the place of a value that was never there. A value that was there is never replaced by a
 * skeleton: it stays, dimmed. It says nothing to a screen reader; what is waited for is said in words.
 */
export function Skeleton({ kind, className }: Props) {
  return (
    <span
      data-testid="skeleton"
      aria-hidden="true"
      className={classNames("block max-w-full rounded-xs bg-surface-2 breathing", HEIGHT[kind], className)}
    />
  );
}
