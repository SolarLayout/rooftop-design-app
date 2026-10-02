"use client";

import { useId, useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { NumberField } from "@/components/ui/NumberField";
import { StatusMark } from "@/components/ui/StatusMark";
import { projectOf } from "@/lib/stores/project-store";
import { designOf } from "@/lib/stores/results-store";
import { SIZING_RANGES, sizingFieldsOf, sizingRowOf, withSizing, type SizingField } from "@/lib/studio/sizing-fields";

const ROW = "flex h-11 w-full cursor-pointer items-center gap-2.5 px-3 text-left type-small focus-ring";

/** A field with its default beside it, the press that gives it back, and the engine's note on it. */
function Field({ field, onCommit }: { field: SizingField; onCommit: (value: number | null) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <NumberField label={field.label} detail={field.detail} value={field.value} unit={field.unit} range={SIZING_RANGES[field.id]} onCommit={onCommit} />
      {field.reset ? (
        <Button kind="quiet" size="s" className="self-end" onClick={() => onCommit(null)}>
          {field.reset}
        </Button>
      ) : null}
      {field.note ? (
        <p data-testid="voc-note" className="flex items-start gap-2 rounded-row border border-note-line bg-note-surface px-3 py-2.5 type-caption text-text">
          <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
          {field.note}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Sizing temperatures (the boards "Studio, Strings lens" and "Inverter and sizing"; plan/phase-07-plan.md,
 * decisions 6 and 7): a closed row with the range the strings are sized for; opened in place, the lowest and
 * the highest ambient, the cell rise and the Voc coefficient, each empty for its default and saying it. A value
 * entered commits an edit of the document; the run follows.
 */
export function SizingTemperatures() {
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const design = useResults(designOf);
  const [isOpen, setOpen] = useState(false);
  const body = useId();
  if (!project) return null;
  const row = sizingRowOf(design);

  return (
    <section aria-label="Sizing temperatures" className={classNames("rounded-row border border-line bg-surface-1", isOpen ? "shadow-card" : "shadow-row")}>
      <button type="button" aria-expanded={isOpen} aria-controls={body} className={ROW} onClick={() => setOpen(!isOpen)}>
        <span className={classNames("grow", isOpen ? "font-medium text-text" : "text-text-2")}>Sizing temperatures</span>
        {row ? <span className="type-value-xs whitespace-nowrap">{row}</span> : null}
        <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} />
      </button>
      {isOpen ? (
        <div id={body} className="flex flex-col gap-3 border-t border-line-subtle px-3 pt-3 pb-4">
          {sizingFieldsOf(project, design).map((field) => (
            <Field key={field.id} field={field} onCommit={(value) => store.getState().commit((document) => withSizing(document, field.id, value))} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
