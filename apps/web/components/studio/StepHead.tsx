import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusMark } from "@/components/ui/StatusMark";
import type { StatusLine } from "./first-open";

type Props = {
  /** The step's instruction: "Check the roof". */
  title: string;
  /** One line under it: what to do, and why. */
  line: string;
  /** The first-open status: what happened, the energy on its way, then the energy; none once the user continued. */
  status: readonly StatusLine[];
};

/**
 * The head of the work column (V2 · 3, D97; the board "The Studio's first open"): the step's instruction, one line under
 * it, and after Build this roof what happened and the energy on its way. The first of the column's three weights: the
 * step, then the facts (the summary rows), then the details (the fields of a row opened).
 */
export function StepHead({ title, line, status }: Props) {
  return (
    <div data-testid="step-head" className="flex flex-col gap-group pb-group">
      <div className="flex flex-col gap-1">
        <h2 className="type-heading text-text">{title}</h2>
        <p className="type-body-touch text-text-2 desktop:type-body">{line}</p>
      </div>
      {status.length === 0 ? null : (
        <div role="status" data-testid="first-open" className="flex flex-col gap-3 rounded-row border border-line bg-surface-1 p-card-compact">
          {status.map((one) => (
            <div key={one.title} className="flex items-start gap-2.5">
              <span className="flex h-5 shrink-0 items-center">{one.mark === "done" ? <StatusMark kind="fits" label="Done" wordsShown={false} size={16} /> : <ProgressRing size={16} />}</span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="font-medium text-text">{one.title}</p>
                <p className="type-body-touch text-text-2 desktop:type-body">{one.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
