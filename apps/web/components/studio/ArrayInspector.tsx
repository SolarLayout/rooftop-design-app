"use client";

import { useState } from "react";
import { useProject, useResults, useStores } from "@/components/shell/stores";
import type { ModuleResponse } from "@/lib/api";
import { mountingFactsOf, mountingSetByOf, spacingFactsOf, spacingOf, spacingSetByOf, windowFactsOf, windowSetByOf } from "@/lib/studio/array-fields";
import { moduleShownOf, type ReplacedModule } from "@/lib/studio/array-view";
import { moduleFactsOf } from "@/lib/studio/module-card";
import { fileSetByOf, sectionSetByOf, wordOf, type SetBy } from "@/lib/studio/set-by";
import { editOf, openedAtOf, projectOf } from "@/lib/stores/project-store";
import { designEditOf, designOf, layoutOf } from "@/lib/stores/results-store";
import { ArrayMounting, type ArrayChange } from "./ArrayMounting";
import { ArraySpacing, ShadeFreeWindow } from "./ArraySpacing";
import { ModuleCard } from "./ModuleCard";
import { ModulePicker } from "./ModulePicker";
import { SummaryRow } from "./SummaryRow";

/** The module read from a replaced file, for the design that was open when it was read. */
type Replaced = ReplacedModule & { openedAt: number | null };

/**
 * The Array step's sections (the boards "Studio, Array lens, states" and "The Studio's first open"; V2 · 3): each one line
 * of facts with who set it, that opens in place: the module with Change (D75), open the first time; the mounting, the
 * spacing and the shade-free window. Every field commits an edit of the document; the layout and the energy follow
 * (decision 16).
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

  const mountingBy = project ? sectionSetByOf(Object.values(mountingSetByOf(project.array, project.roof.roof_type))) : null;
  const spacingBy = project ? sectionSetByOf(Object.values(spacingSetByOf(project.array, project.roof.roof_type))) : null;
  const windowBy = project ? sectionSetByOf(Object.values(windowSetByOf(project.array))) : null;
  const said = (by: SetBy | null) => (by === null ? null : wordOf(by));

  return (
    <div className="flex flex-col">
      <SummaryRow id="array.module" title="Module" help="studio.section.module" facts={shown ? moduleFactsOf(shown.module) : null} setBy={project ? wordOf(fileSetByOf(project.pan_text)) : null} opensFirst>
        <ModuleCard
          shown={shown}
          onChange={() => {
            setOpenings((count) => count + 1);
            setReplacing(true);
          }}
        />
      </SummaryRow>
      {project ? (
        <>
          <SummaryRow id="array.mounting" title="Mounting" help="studio.section.mounting" facts={mountingFactsOf(project.array, project.roof)} setBy={said(mountingBy)}>
            <ArrayMounting array={project.array} roof={project.roof} onChange={changeArray} />
          </SummaryRow>
          {spacingOf(project.roof.roof_type).length > 0 ? (
            <SummaryRow id="array.spacing" title="Spacing" help="studio.section.spacing" facts={spacingFactsOf(project.array, layout, project.roof.roof_type)} setBy={said(spacingBy)}>
              <ArraySpacing array={project.array} roofType={project.roof.roof_type} layout={layout} onChange={changeArray} />
            </SummaryRow>
          ) : null}
          <SummaryRow id="array.window" title="Shade-free window" help="studio.section.shade-free-window" facts={windowFactsOf(project.array)} setBy={said(windowBy)}>
            <ShadeFreeWindow array={project.array} onChange={changeArray} />
          </SummaryRow>
        </>
      ) : null}
      <ModulePicker key={openings} open={isReplacing} current={shown?.module.source ?? null} onRead={moduleRead} onClose={() => setReplacing(false)} />
    </div>
  );
}
