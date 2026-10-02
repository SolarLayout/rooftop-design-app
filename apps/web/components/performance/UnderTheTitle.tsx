import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { FailedRow as Failed, RunRow as Run } from "@/lib/performance/page-view";

/**
 * A run on its way, under the title (the board "Performance, states"; components.md, "Vitals: states"): the ring of
 * 20 with its arc, what is done in a word, the step of the engine. On phone the step takes the next line. The ring
 * turns where how far is not known: a weather being loaded (the board "Weather and assumptions").
 */
export function RunRow({ run }: { run: Run }) {
  return (
    <div data-testid="run-step" role="status" className="flex flex-col gap-0.5 py-0.5 tablet:h-7 tablet:flex-row tablet:items-center tablet:gap-2.5 tablet:py-0">
      <span className="flex h-6 items-center gap-2.5">
        <ProgressRing size={20} share={run.share ?? undefined} label={run.step ?? run.title} />
        <span className="type-small font-medium whitespace-nowrap">{run.title}</span>
      </span>
      {run.step ? <span className="pl-7.5 type-small text-text-2 tablet:pl-0 tablet:type-caption">{run.step}</span> : null}
    </div>
  );
}

/**
 * A run that failed, under the title (the same board): a note with what did not happen, what the values are, Try
 * again as a quiet press, and the reason in the API's words under them.
 */
export function FailedRow({ failed, onTryAgain }: { failed: Failed; onTryAgain: () => void }) {
  return (
    <div data-testid="run-failed" role="status" className="mt-0.5 flex items-start gap-2.5 rounded-control border border-note-line bg-note-surface py-2 pr-3 pl-2.5">
      <Icon name="note" size={20} className="mt-0.5 shrink-0 text-accent" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-2.5">
          <span className="type-small font-medium">{failed.title}</span>
          <span className="type-caption text-text-2">{failed.detail} ·</span>
          <Button kind="quiet" size="s" onClick={onTryAgain} className="type-caption font-medium">
            {failed.action}
          </Button>
        </div>
        <p className="type-caption text-text-2">{failed.message}</p>
      </div>
    </div>
  );
}
