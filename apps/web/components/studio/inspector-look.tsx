import type { ReactNode } from "react";

// The look of what the inspectors of the Studio share (the boards "Studio, Array lens" and "Studio,
// Roof lens"): the section label, a row with its control at the right, and a value the engine decided,
// read out with the reason under it.

export const SECTION = "type-section text-text-3 uppercase";

/** A row of the inspector: the label at the left, the control at the right. */
export const ROW = "flex min-h-10 items-center justify-between gap-row";

type ReadOutProps = {
  label: string;
  /** The value in mono; null while there is none yet. */
  value: string | null;
  /** Where the value comes from, under it; null while there is nothing to say. */
  line: string | null;
  /** What stands at the right: a switch that hands the value to the engine or takes it back. */
  children?: ReactNode;
  className?: string;
};

/** A value the engine decided, with the reason under it, and what stands beside it. */
export function ReadOut({ label, value, line, children, className }: ReadOutProps) {
  return (
    <div data-testid="read-out" className={className}>
      <div className="flex items-center gap-row">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <span className="flex items-baseline gap-2">
            <span className="text-text-2">{label}</span>
            {value === null ? null : (
              <span data-testid="read-out-value" className="type-value desktop:type-value-s">
                {value}
              </span>
            )}
          </span>
          {line === null ? null : (
            <span data-testid="read-out-line" className="type-caption text-text-3">
              {line}
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
