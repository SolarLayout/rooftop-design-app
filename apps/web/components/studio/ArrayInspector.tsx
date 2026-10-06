"use client";

import { useId, useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import type { ModuleResponse } from "@/lib/api";
import { moduleShownOf, type ReplacedModule } from "@/lib/studio/array-view";
import { editOf, openedAtOf, projectOf } from "@/lib/stores/project-store";
import { designEditOf, designOf, layoutOf } from "@/lib/stores/results-store";
import { ArrayMounting, type ArrayChange } from "./ArrayMounting";
import { ArraySpacing } from "./ArraySpacing";
import { SECTION } from "./inspector-look";
import { ModuleCard } from "./ModuleCard";
import { ModulePicker } from "./ModulePicker";

/** The module read from a replaced file, for the design that was open when it was read. */
type Replaced = ReplacedModule & { openedAt: number | null };

/**
 * The inspector of the Array lens (the boards "Studio, Array lens" on three sizes and "Studio, Array
 * lens, states"): the module with Change (D75), the mounting, the spacing and the shade-free window. Every field commits an edit of the document;
 * the layout and the energy follow (decision 16).
 */
export function ArrayInspector() {
  const { project: store } = useStores();
  const project = useProject(projectOf);
  const openedAt = useProject(openedAtOf);
  const design = useResults(designOf);
  const designEdit = useResults(designEditOf);
  const layout = useResults(layoutOf);
  const [replaced, setReplaced] = useState<Replaced | null>(null);
  const [isReplacing, setReplacing] = useState(false);
  // Each opening of the picker mounts it afresh: its filters and its choice at rest.
  const [openings, setOpenings] = useState(0);
  const heading = useId();

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
        <section aria-labelledby={heading} className="flex flex-col gap-2">
          <h2 id={heading} className={SECTION}>
            Module
          </h2>
          <ModuleCard
            shown={shown}
            onChange={() => {
              setOpenings((count) => count + 1);
              setReplacing(true);
            }}
          />
        </section>
        {project ? <ArrayMounting array={project.array} roof={project.roof} onChange={changeArray} /> : null}
      </div>
      {project ? (
        <div className="flex flex-col gap-section">
          <ArraySpacing array={project.array} roofType={project.roof.roof_type} layout={layout} onChange={changeArray} />
        </div>
      ) : null}
      <ModulePicker key={openings} open={isReplacing} current={shown?.module.source ?? null} onRead={moduleRead} onClose={() => setReplacing(false)} />
    </div>
  );
}
