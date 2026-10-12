import { FailedRow } from "@/components/shell/UnderTheTitle";
import { classNames } from "@/components/ui/class-names";
import type { DesignOption, DesignResult, Project } from "@/lib/api";
import { cadViewOf, planOf } from "@/lib/handover/cad-view";
import type { ReportView } from "@/lib/handover/report-view";
import { FactRows } from "./FactRows";
import { PAGE_IMAGE, PAPER, PageImage } from "./paper";

type Props = {
  /** The document, the run and the option the file is of. */
  files: { document: Project; design: DesignResult; option: DesignOption };
  /** The report's pages, where the engine's plan is drawn already (decision 8). */
  report: ReportView;
  /** Try again under the plan: the pages are asked for once more. */
  onTryAgain: () => void;
};

// The board "Handover, previews", the CAD layout: the engine's plan in a paper frame of 560 at the left, the layers at the
// right, 24 apart; under the width of a desktop column the plan takes the width and the layers follow.
const BODY = "flex min-w-0 flex-col gap-4 desktop:flex-row desktop:items-start desktop:gap-6";
const PLAN = "w-full min-w-0 desktop:w-140 desktop:shrink-0";

/**
 * The body of the CAD layout (plan/phase-09-plan.md, step 19, decision 8): the engine's plan, the page of the report titled
 * Layout, in the paper frame, a breathing block of its shape while the pages come and the API's words with Try again when
 * they did not; behind "What is in the file", the DXF's layers from the run with what is on each and the line "R2010 ·
 * metres · x east, y north".
 */
export function CadPreview({ files, report, onTryAgain }: Props) {
  const view = cadViewOf(files);
  const plan = planOf(report);

  return (
    <div data-testid="cad-layout" className={BODY}>
      <div className={classNames(PLAN, report.isStale && "opacity-updating")}>
        {plan ? (
          <figure aria-label={plan.name} className={PAPER}>
            <PageImage src={plan.src} alt={`${plan.title} · page ${plan.number} of the report`} width={plan.width} height={plan.height} data-testid="plan-image" className={PAGE_IMAGE} />
          </figure>
        ) : report.failed ? (
          <FailedRow failed={report.failed} onTryAgain={onTryAgain} />
        ) : (
          <div data-testid="plan-skeleton" aria-hidden="true" className="w-full aspect-paper rounded-control bg-surface-2 breathing" />
        )}
      </div>
      {/* The DXF's internals stand behind a line, for who opens the file in CAD (V2 · 9, audit V2-92). */}
      <details data-testid="in-the-file" className="min-w-0 grow">
        <summary className="flex h-touch cursor-pointer items-center gap-1 rounded-control type-strong-touch desktop:h-8 desktop:type-strong text-text-2 hovered:text-text focus-ring">
          What is in the file
        </summary>
        <div className="pt-2">
          <FactRows title="Layers" rows={view.layers} mono caption={view.about} testId="layer" />
        </div>
      </details>
    </div>
  );
}
