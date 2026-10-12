import { classNames } from "./class-names";
import { ProgressRing } from "./ProgressRing";
import { percentOf } from "./ring-arc";

type Props = {
  /** The step of the run, in the words of the engine. */
  step: string;
  /** How far the run is, from 0 to 1. */
  share: number;
  className?: string;
};

/** A run in a row: how far it is, and at which step. */
export function RunStep({ step, share, className }: Props) {
  return (
    <div data-testid="run" className={classNames("flex min-h-13 items-center gap-row rounded-row bg-surface-2 px-3.5", className)}>
      <ProgressRing size={20} share={share} label={step} />
      <span className="grow">{step}</span>
      <span className="type-mono-touch desktop:type-mono text-text-2">{percentOf(share)} %</span>
    </div>
  );
}
