"use client";

import { useId } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { LIST_GAP } from "@/components/ui/design-numbers";
import { FloatingPanel } from "@/components/ui/FloatingPanel";
import { IconButton } from "@/components/ui/IconButton";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusMark } from "@/components/ui/StatusMark";
import { useFloating } from "@/components/ui/use-floating";
import type { ResultChip as Chip, SummaryRow } from "./result-view";

type Props = {
  chip: Chip;
  summary: readonly SummaryRow[];
  onOpenNotes: () => void;
  className?: string;
};

const CHIP = classNames(
  "flex h-touch shrink-0 cursor-pointer items-center gap-2 rounded-control border border-line bg-control px-3 shadow-raised whitespace-nowrap select-none",
  "press-motion focus-ring hovered:border-line-hover hovered:bg-control-hover desktop:h-10",
);

const toReviewOf = (count: number) => `${count} to review`;

/**
 * The result at the top bar's right (D95; the board "V2 · 2"): the energy of year 1, a note mark and how many notes wait
 * beside it; pressed, the summary in plain names with Open Performance, and the notes when some wait.
 */
export function ResultChip({ chip, summary, onOpenNotes, className }: Props) {
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
            <span className={classNames("flex items-baseline gap-1.5", chip.isDimmed && "opacity-updating")}>
              <span className="type-strong-touch tabular-nums desktop:type-strong">{chip.figure}</span>
              <span className="type-body-touch text-text-2 desktop:type-body">
                MWh<span className="hidden desktop:inline"> a year</span>
              </span>
            </span>
            {chip.isDimmed ? <ProgressRing size={16} /> : null}
            {chip.toReview > 0 ? (
              <span className="flex items-center gap-1.5 border-l border-line pl-2">
                <StatusMark kind="note" label={toReviewOf(chip.toReview)} wordsShown={false} size={16} />
                <span className="hidden type-body desktop:inline">{toReviewOf(chip.toReview)}</span>
              </span>
            ) : null}
          </>
        ) : chip.kind === "computing" ? (
          <>
            <ProgressRing size={16} />
            <span className="hidden type-body text-text-2 tablet:inline">{chip.words}</span>
          </>
        ) : (
          <>
            <StatusMark kind="note" label={chip.words} wordsShown={false} size={16} />
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
          {summary.length > 0 ? (
            <dl className="flex flex-col">
              {summary.map((row) => (
                <div key={row.id} className="flex items-baseline justify-between gap-4 border-t border-line-subtle py-2 first:border-t-0">
                  <dt className="type-body text-text-2">{row.name}</dt>
                  <dd className="type-strong tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
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
          <ButtonLink href="/performance" size="m" onClick={() => floating.close()}>
            Open Performance
          </ButtonLink>
        </div>
      </FloatingPanel>
    </>
  );
}
