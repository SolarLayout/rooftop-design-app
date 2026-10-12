"use client";

import { useId } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Problem } from "@/components/ui/Problem";
import { StatusMark } from "@/components/ui/StatusMark";
import { useFloating } from "@/components/ui/use-floating";
import type { ResultChip as Chip, SummaryRow } from "./result-view";

type Props = {
  chip: Chip;
  summary: readonly SummaryRow[];
  onOpenNotes: () => void;
  /** Asks again for what failed (the flow's Try again). */
  onTryAgain: () => void;
  className?: string;
};

const CHIP = classNames(
  "flex h-touch shrink-0 cursor-pointer items-center gap-2 rounded-control border border-line bg-control px-3 shadow-raised whitespace-nowrap select-none",
  "press-motion focus-ring hovered:border-line-hover hovered:bg-control-hover desktop:h-10",
);

/** The failed chip on phone, where "Energy not computed" has no room (the board "V2 · 5"). */
const NO_ENERGY = "No energy";

const toReviewOf = (count: number) => `${count} to review`;

/** The energy of year 1 in the chip: the figure and its unit. Dimmed while a newer one comes, and while the last one is shown. */
function Figure({ figure, isDimmed, isShort = false, hiddenOnPhone = false }: { figure: string; isDimmed: boolean; isShort?: boolean; hiddenOnPhone?: boolean }) {
  return (
    <span className={classNames("items-baseline gap-1.5", hiddenOnPhone ? "hidden tablet:flex" : "flex", isDimmed && "opacity-updating")}>
      <span className="type-strong-touch tabular-nums desktop:type-strong">{figure}</span>
      <span className="type-body-touch text-text-2 desktop:type-body">
        MWh{isShort ? null : <span className="hidden desktop:inline"> a year</span>}
      </span>
    </span>
  );
}

/**
 * The result at the top bar's right (D95; the boards "V2 · 2" and "V2 · 5"), in six states: computing; the result; updating
 * (the result dimmed, with the ring); to review (a note mark and how many wait, before the result); failed, with nothing
 * before ("Energy not computed"); stale, the last result dimmed and marked ("Showing the last result"). Pressed, the summary
 * in plain names with Open Performance, and the notes when some wait; a failed or stale chip opens its problem with Try again.
 */
export function ResultChip({ chip, summary, onOpenNotes, onTryAgain, className }: Props) {
  const [floating, trigger] = useFloating({ side: "below", align: "end", gap: LIST_GAP });
  const id = useId();
  const words = chip.kind === "result" ? `${chip.figure} ${chip.words}${chip.toReview > 0 ? `, ${toReviewOf(chip.toReview)}` : ""}` : chip.words;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        data-testid="result-chip"
        aria-label={`Result: ${words}`}
        aria-haspopup="dialog"
        aria-expanded={floating.isOpen}
        aria-controls={id}
        onClick={() => (floating.isOpen ? floating.close() : floating.open())}
        className={classNames(CHIP, className)}
      >
        {chip.kind === "result" ? (
          <>
            {chip.toReview > 0 ? (
              <span className="flex items-center gap-1.5 border-r border-line pr-2">
                <StatusMark kind="note" label={toReviewOf(chip.toReview)} wordsShown={false} size={16} />
                <span className="type-body-touch tablet:type-body">{toReviewOf(chip.toReview)}</span>
              </span>
            ) : null}
            <Figure figure={chip.figure} isDimmed={chip.isDimmed} hiddenOnPhone={chip.toReview > 0} />
            {chip.isDimmed ? <ProgressRing size={16} /> : null}
          </>
        ) : chip.kind === "computing" ? (
          <>
            <ProgressRing size={16} />
            <span className="hidden type-body text-text-2 tablet:inline">{chip.words}</span>
          </>
        ) : chip.kind === "stale" ? (
          <>
            <StatusMark kind="note" label={chip.words} wordsShown={false} size={16} />
            <Figure figure={chip.figure} isDimmed isShort />
            <span className="hidden type-body tablet:inline">{chip.words}</span>
          </>
        ) : (
          <>
            <StatusMark kind="note" label={chip.words} wordsShown={false} size={16} />
            <span className="type-body-touch tablet:hidden">{NO_ENERGY}</span>
            <span className="hidden type-body tablet:inline">{chip.words}</span>
          </>
        )}
      </button>
      <FloatingPanel floating={floating} width="card">
        <div id={id} role="dialog" aria-label="The result" className="flex flex-col gap-3 rounded-row border border-line-strong bg-surface-1 p-4 shadow-float">
          <div className="flex items-center justify-between gap-2">
            <p className="type-section text-text">The result</p>
            <IconButton kind="quiet" size="xs" icon="close" iconSize={18} label="Close" onClick={floating.closeAndGoBack} />
          </div>
          {chip.kind === "failed" || chip.kind === "stale" ? (
            <Problem
              problem={chip.problem}
              onAction={(action) => {
                floating.close();
                if (action.id === "try-again") onTryAgain();
              }}
            />
          ) : null}
          {summary.length > 0 ? (
            <dl className="flex flex-col">
              {summary.map((row) => (
                <div key={row.id} className="flex items-baseline justify-between gap-4 border-t border-line-subtle py-2 first:border-t-0">
                  <dt className="type-body text-text-2">{row.name}</dt>
                  <dd className="type-strong tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : chip.kind === "failed" ? null : (
            <p className="type-body text-text-2">{chip.words}</p>
          )}
          {chip.kind === "result" && chip.toReview > 0 ? (
            <Button
              kind="secondary"
              size="m"
              onClick={() => {
                floating.close();
                onOpenNotes();
              }}
            >
              {toReviewOf(chip.toReview)}
            </Button>
          ) : null}
          {chip.kind === "failed" ? null : (
            <ButtonLink href="/performance" size="m" onClick={() => floating.close()}>
              Open Performance
            </ButtonLink>
          )}
        </div>
      </FloatingPanel>
    </>
  );
}
