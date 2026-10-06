"use client";

import { withTrueMinus } from "@/components/shell/notes-view";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusMark } from "@/components/ui/StatusMark";
import { moduleCardOf } from "@/lib/studio/module-card";
import type { ModuleShown } from "@/lib/studio/array-view";
import { ChangeButton } from "./ChangeButton";

type Props = {
  /** The module shown; null before a run or a file gave one, when the card is a skeleton. */
  shown: ModuleShown | null;
  /** Opens the picker of the library (D75). */
  onChange: () => void;
};

const CARD = "flex flex-col gap-2.5 rounded-card-s border border-line bg-surface-1 p-card-compact shadow-card";

/** The module as a drawing: the glass in its frame, in two halves (the boards of the Studio). */
function ModuleGlyph() {
  return (
    <span aria-hidden="true" className="flex h-14 w-11 shrink-0 flex-col rounded-xs border border-module-frame bg-module-glass">
      <span className="grow" />
      <span className="h-px shrink-0 bg-module-frame" />
      <span className="grow" />
    </span>
  );
}

/**
 * The module of the design (docs/design/components.md, "Cards", the board "Studio, Array lens, states"):
 * the model, the maker and the Wp, the size, the facts, the coefficients with the engine's notes about
 * them, the file, and Change (D75). Before a run or a file gave a module, a skeleton says what is waited for.
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
        <p role="status" className="flex items-center gap-2.5 type-caption text-text-2">
          <ProgressRing size={16} />
          Reading the module with the first run
        </p>
      </section>
    );
  }

  const card = moduleCardOf(shown.module, shown.coefficients);
  return (
    <section aria-label="Module" data-testid="module-card" className={CARD}>
      <div className="flex gap-3.5">
        <ModuleGlyph />
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <span data-testid="module-title" className="font-semibold">
            {card.title}
          </span>
          <span className="type-caption text-text-2">{card.maker}</span>
          <span className="type-caption text-text-3">{card.size}</span>
        </div>
      </div>
      <code className="type-value-xs text-text-2">{card.facts}</code>
      <p className="flex items-start gap-2 type-caption text-text-2">
        {shown.notes.length > 0 ? <StatusMark kind="note" label="Note" wordsShown={false} size={14} className="mt-0.75" /> : null}
        <span>{card.coefficients}</span>
      </p>
      {shown.notes.map((note) => (
        <p key={note} data-testid="module-note" className="rounded-item border border-note-line bg-note-surface px-2.5 py-2 type-caption text-text-2">
          {withTrueMinus(note)}
        </p>
      ))}
      <code data-testid="module-file" className="type-value-xs text-text-3">
        {card.file}
      </code>
      <div className="flex justify-end">
        <ChangeButton kind="modules" onChange={onChange} />
      </div>
    </section>
  );
}
