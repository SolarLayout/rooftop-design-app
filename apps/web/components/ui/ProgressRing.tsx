import { classNames } from "./class-names";
import { arcOf, percentOf, type RingSize } from "./ring-arc";

type Props = {
  size?: RingSize;
  /** How far, from 0 to 1. Without it how far is not known, and the ring turns. */
  share?: number;
  /**
   * What is waited for, for a screen reader. Without it the ring is for the eye only: it then stands
   * beside words that say the same.
   */
  label?: string;
  /** The percent inside the ring. It has room in the ring of 44. */
  numberShown?: boolean;
  className?: string;
};

const SIDE: Record<RingSize, string> = { 12: "size-3", 16: "size-4", 20: "size-5", 44: "size-11" };

// A ring that turns shows a quarter of the way around.
const TURNING = 0.25;

/** Something is on its way: a ring that turns, or one with an arc that says how far. */
export function ProgressRing({ size = 16, share, label, numberShown = false, className }: Props) {
  const turns = share === undefined;
  const { radius, line, around, filled } = arcOf(share ?? TURNING, size);
  const circle = { cx: 12, cy: 12, r: radius, strokeWidth: line };

  const ring = (
    <svg
      viewBox="0 0 24 24"
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-valuemin={label && !turns ? 0 : undefined}
      aria-valuemax={label && !turns ? 100 : undefined}
      aria-valuenow={label && !turns ? percentOf(share) : undefined}
      aria-hidden={label ? undefined : "true"}
      className={classNames("shrink-0 -rotate-90 fill-none", SIDE[size], turns && "turning", !numberShown && className)}
    >
      <circle data-testid="ring-track" className="stroke-line-strong" {...circle} />
      <circle
        data-testid="ring-arc"
        className="stroke-accent"
        strokeLinecap="round"
        strokeDasharray={`${filled.toFixed(2)} ${around.toFixed(2)}`}
        {...circle}
      />
    </svg>
  );
  if (!numberShown || turns) return ring;

  return (
    <span className={classNames("relative inline-flex shrink-0 items-center justify-center", SIDE[size], className)}>
      <span className="absolute inset-0 flex">{ring}</span>
      <span aria-hidden="true" className="type-tick font-medium">
        {percentOf(share)}
      </span>
    </span>
  );
}
