"use client";

import { useEffect } from "react";
import { useStore } from "zustand";
import { useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { measures } from "@/components/ui/measures";
import { calloutOf } from "@/lib/scene/keepout";
import { labelsOf, type StageStore } from "@/lib/scene/stage-store";
import { projectOf } from "@/lib/stores/project-store";
import { layoutOf } from "@/lib/stores/results-store";
import { selectionOf } from "@/lib/stores/view-store";

type Props = { stage: StageStore };

/**
 * The callout of what is selected on the roof (docs/design/components.md, "Callout on the stage"): a
 * chip joined to its object by a line and a dot, placed where the Projector says the object falls. For
 * a kept-clear area it says how many positions it keeps clear and what shades it, when. Escape clears.
 */
export function Callout({ stage }: Props) {
  const { view } = useStores();
  const selection = useView(selectionOf);
  const project = useProject(projectOf);
  const layout = useResults(layoutOf);
  const hung = useStore(stage, labelsOf).find((label) => label.kind === "callout");

  useEffect(() => {
    if (!selection) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") view.getState().clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, view]);

  if (!selection || selection.kind !== "keepout" || !project || !layout || !hung?.visible) return null;
  const part = layout.layout.keepout[selection.index];
  if (!part) return null;
  const { array } = project;
  const words = calloutOf(part, { from: array.window_start_h, to: array.window_end_h, allowShaded: array.allow_shaded });

  return (
    <div className="pointer-events-none absolute inset-0 z-stage-overlay overflow-hidden contain-layout">
      <div data-testid="stage-callout" role="status" className="placed flex flex-col items-start" style={measures({ x: hung.x, y: hung.y })}>
        <span className="block size-2.25 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
        <span className="-mt-1.75 block h-10 w-px -translate-x-1/2 -translate-y-full bg-accent" />
        <div className="-translate-y-22 flex flex-col gap-0.5 rounded-row border border-note-line bg-surface-1 px-3.5 py-2.5 shadow-float">
          <span className="type-small font-medium whitespace-nowrap text-text">{words.title}</span>
          <span className="type-caption whitespace-nowrap text-text-2">{words.detail}</span>
        </div>
      </div>
    </div>
  );
}
