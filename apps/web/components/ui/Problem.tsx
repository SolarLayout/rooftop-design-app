"use client";

import { useId, useState } from "react";
import type { Problem as ProblemFacts, ProblemAction } from "@/lib/errors/problem-of";
import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";
import { classNames } from "./class-names";
import { Icon } from "./Icon";
import { StatusMark } from "./StatusMark";

type Props = {
  problem: ProblemFacts;
  /** A button pressed: Try again, Choose another inverter. A button that leads (Open) leads by its address and tells here too. */
  onAction: (action: ProblemAction) => void;
  /** The name the browser tests find the problem by. */
  testId?: string;
  className?: string;
};

/**
 * Every problem the app shows, in one shape (V2 · 5, D101; the board "Problems"): the note mark and the title, the cause
 * and the remedy in one paragraph, a button for each remedy, and the details only a developer reads behind Details, in
 * mono. A problem of the result stands in the chip's panel, of a step at its head, of a refused file in its dialog.
 */
export function Problem({ problem, onAction, testId = "problem", className }: Props) {
  const [areDetailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const words = problem.remedy === null ? problem.cause : `${problem.cause} ${problem.remedy}`;
  return (
    <div role="alert" data-testid={testId} className={classNames("flex flex-col gap-3 rounded-row border border-note-line bg-note-surface p-4", className)}>
      <div className="flex items-start gap-2.5">
        <span className="flex pt-0.5">
          <StatusMark kind="note" label="Note" wordsShown={false} size={18} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-medium text-text">{problem.title}</p>
          <p className="type-body-touch text-text-2 desktop:type-body">{words}</p>
        </div>
      </div>
      {problem.actions.length === 0 ? null : (
        <div className="flex flex-wrap gap-2 pl-7">
          {problem.actions.map((action) =>
            action.href === undefined ? (
              <Button key={action.id} kind="secondary" size="m" onClick={() => onAction(action)}>
                {action.label}
              </Button>
            ) : (
              <ButtonLink key={action.id} kind="secondary" size="m" href={action.href} onClick={() => onAction(action)}>
                {action.label}
              </ButtonLink>
            ),
          )}
        </div>
      )}
      {problem.details === null ? null : (
        <div className="flex flex-col gap-1 pl-7">
          <button
            type="button"
            aria-expanded={areDetailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((open) => !open)}
            className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-control font-medium text-text-2 focus-ring hovered:text-text"
          >
            Details
            <Icon name={areDetailsOpen ? "chevron-down" : "chevron-right"} size={14} />
          </button>
          {areDetailsOpen ? (
            <p id={detailsId} data-testid="problem-details" className="type-mono-touch desktop:type-mono rounded-control bg-well px-3 py-2 break-words whitespace-pre-wrap text-text-2">
              {problem.details}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
