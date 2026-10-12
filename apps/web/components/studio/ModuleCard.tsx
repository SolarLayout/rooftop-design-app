"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { withTrueMinus } from "@/components/shell/notes-view";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusMark } from "@/components/ui/StatusMark";
import { moduleCardOf, type ModuleCard as ModuleCardType } from "@/lib/studio/module-card";
import type { ModuleShown } from "@/lib/studio/array-view";
import { ChangeButton } from "./ChangeButton";

type Props = {
  /** The module shown; null before a run or a file gave one, when the card is a skeleton. */
  shown: ModuleShown | null;
  /** Opens the picker of the library (D75). */
  onChange: () => void;
};

const CARD = "flex flex-col gap-2.5 rounded-row border border-line bg-surface-1 p-card-compact shadow-card";

/** The module as a drawing: the glass in its frame, in two halves (the boards of the Studio). */
function ModuleGlyph() {
  return (
    <span aria-hidden="true" className="flex h-14 w-11 shrink-0 flex-col rounded-control border border-module-frame bg-module-glass">
      <span className="grow" />
      <span className="h-px shrink-0 bg-module-frame" />
      <span className="grow" />
    </span>
  );
}

/** The electrical figures behind a line (V2 · 7): Details opens them in plain names, on `well`. */
function Details({ rows }: { rows: ModuleCardType["details"] }) {
  const [isOpen, setOpen] = useState(false);
  const body = useId();
  return (
    <div className="flex flex-col gap-2">
      <button type="button" aria-expanded={isOpen} aria-controls={body} onClick={() => setOpen((open) => !open)} className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-1 rounded-control type-body-touch desktop:type-body text-text-2 focus-ring hovered:text-text desktop:min-h-0">
        Details
        <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={14} />
      </button>
      {isOpen ? (
        <dl id={body} data-testid="module-details" className="flex flex-col rounded-row bg-surface-1 px-3 py-1.5">
          {rows.map((row) => (
            <div key={row.name} className="flex items-baseline justify-between gap-4 py-2 type-body-touch desktop:type-body">
              <dt className="text-text-2">{row.name}</dt>
              <dd className="tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/**
 * The module of the design (V2 · 7, D103; the board "The Roof and Array steps"): the model, the maker as people know it
 * with the power and the size, and Change (D75); the electrical figures behind Details, the engine's notes under the
 * card. Before a run or a file gave a module, a skeleton says what is waited for.
 */
export function ModuleCard({ shown, onChange }: Props) {
  if (!shown) {
    return (
      <section aria-label="Module" data-testid="module-card" className={CARD}>
        <div className="flex gap-3.5">
          <ModuleGlyph />
          <div className="flex grow flex-col gap-2 pt-1">
            <Skeleton kind="value" className="w-37.5" />
            <Skeleton kind="label" className="w-55" />
            <Skeleton kind="label" className="w-42.5" />
          </div>
        </div>
        <Skeleton kind="label" className="w-65" />
        <Skeleton kind="label" className="w-75" />
        <p role="status" className="flex items-center gap-2.5 type-body-touch desktop:type-body text-text-2">
          <ProgressRing size={16} />
          Reading the module with the first run
        </p>
      </section>
    );
  }

  const card = moduleCardOf(shown.module, shown.coefficients);
  return (
    <section aria-label="Module" data-testid="module-card" className="flex flex-col gap-2">
      <div className={CARD}>
        <div className="flex items-center gap-3.5">
          <ModuleGlyph />
          <div className="flex min-w-0 grow flex-col gap-0.5">
            <span data-testid="module-title" className="font-semibold">
              {card.title}
            </span>
            <span className="type-body-touch desktop:type-body text-text-2">{card.maker}</span>
          </div>
          <ChangeButton kind="modules" onChange={onChange} />
        </div>
      </div>
      {shown.notes.map((note) => (
        <p key={note} data-testid="module-note" className="flex items-start gap-2 rounded-control border border-note-line bg-note-surface px-2.5 py-2 type-body-touch desktop:type-body text-text-2">
          <StatusMark kind="note" label="Note" wordsShown={false} size={14} className="mt-0.75 shrink-0" />
          {withTrueMinus(note)}
        </p>
      ))}
      <Details rows={card.details} />
    </section>
  );
}
