"use client";

import { useProject, useResults, useStores } from "@/components/shell/stores";
import { NumberField } from "@/components/ui/NumberField";
import { StatusMark } from "@/components/ui/StatusMark";
import { projectOf } from "@/lib/stores/project-store";
import { designOf } from "@/lib/stores/results-store";
import { SIZING_RANGES, sizingFieldsOf, withSizing, type SizingField } from "@/lib/studio/sizing-fields";
import { SetByHint } from "./SetByHint";

/** A field with who set it and its default under the label, Reset for a value entered, and the engine's note on it. */
function Field({ field, onCommit }: { field: SizingField; onCommit: (value: number | null) => void }) {
  const detail = field.value === null ? field.detail : <SetByHint setBy={field.setBy} onReset={() => onCommit(null)} />;
  return (
    <div className="flex flex-col gap-1.5">
      <NumberField label={field.label} detail={detail} value={field.value} unit={field.unit} range={SIZING_RANGES[field.id]} onCommit={onCommit} />
      {field.note ? (
        <p data-testid="voc-note" className="flex items-start gap-2 rounded-row border border-note-line bg-note-surface px-3 py-2.5 type-body-touch desktop:type-body text-text">
          <StatusMark kind="note" label="Note" wordsShown={false} size={16} />
          {field.note}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Sizing temperatures (the boards "Studio, Strings lens" and "Inverter and sizing"; plan/phase-07-plan.md, decisions 6
 * and 7), inside the Strings step's summary row (V2 · 3): the lowest and the highest ambient, the cell rise and the Voc
 * coefficient, each empty for its default and saying who set it, with Reset for a value entered. A value entered commits
 * an edit of the document; the run follows.
 */
export function SizingTemperatures() {
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const design = useResults(designOf);
  if (!project) return null;

  return (
    <div className="flex flex-col gap-3">
      {sizingFieldsOf(project, design).map((field) => (
        <Field key={field.id} field={field} onCommit={(value) => store.getState().commit((document) => withSizing(document, field.id, value))} />
      ))}
    </div>
  );
}
