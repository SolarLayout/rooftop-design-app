"use client";

import { useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import type { ModuleResponse } from "@/lib/api";
import { moduleShownOf, type ReplacedModule } from "@/lib/studio/array-view";
import { editOf, openedAtOf, projectOf } from "@/lib/stores/project-store";
import { designEditOf, designOf } from "@/lib/stores/results-store";
import { ArrayMounting, type ArrayChange } from "./ArrayMounting";
import { ModuleCard } from "./ModuleCard";
import { ReplaceModuleDialog } from "./ReplaceModuleDialog";

/** The module read from a replaced file, for the design that was open when it was read. */
type Replaced = ReplacedModule & { openedAt: number | null };

/**
 * The inspector of the Array lens (the boards "Studio, Array lens" on three sizes and "Studio, Array
 * lens, states"): the module with Replace, the mounting. Every field commits an edit of the document;
 * the layout and the energy follow (decision 16).
 */
export function ArrayInspector() {
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const openedAt = useProject(openedAtOf);
  const design = useResults(designOf);
  const designEdit = useResults(designEditOf);
  const [replaced, setReplaced] = useState<Replaced | null>(null);
  const [isReplacing, setReplacing] = useState(false);

  // A file read for another design says nothing about this one.
  const shown = moduleShownOf({ design, designEdit, replaced: replaced?.openedAt === openedAt ? replaced : null });

  function changeArray(change: ArrayChange) {
    store.getState().commit((document) => {
      const array = change(document.array);
      return array === document.array ? document : { ...document, array };
    });
  }

  /** The file read becomes the document's module; the card shows it until the run with it lands. */
  function moduleRead(read: ModuleResponse) {
    store.getState().commit((document) => ({ ...document, pan_text: read.text, pan_path: read.file }));
    setReplaced({ module: read.module, coefficients: read.coefficients, notes: read.notes, edit: editOf(store.getState()), openedAt });
    setReplacing(false);
  }

  return (
    <div className="flex flex-col gap-section tablet:grid tablet:grid-cols-2 tablet:gap-x-8 desktop:flex desktop:flex-col">
      <div className="flex flex-col gap-section">
        <ModuleCard shown={shown} onReplace={() => setReplacing(true)} />
        {project ? <ArrayMounting array={project.array} roof={project.roof} onChange={changeArray} /> : null}
      </div>
      <ReplaceModuleDialog open={isReplacing} onRead={moduleRead} onClose={() => setReplacing(false)} />
    </div>
  );
}
