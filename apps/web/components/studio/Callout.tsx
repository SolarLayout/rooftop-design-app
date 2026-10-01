"use client";

import { useStore } from "zustand";
import { useProject, useResults, useView } from "@/components/shell/stores";
import { measures } from "@/components/ui/measures";
import type { Layout, Project } from "@/lib/api";
import { calloutOf, type Callout as Words } from "@/lib/scene/keepout";
import { calloutOfObstacle } from "@/lib/scene/obstacles";
import { calloutOfModule, calloutOfRoof } from "@/lib/scene/pick";
import { labelsOf, type StageStore } from "@/lib/scene/stage-store";
import { projectOf } from "@/lib/stores/project-store";
import { layoutOf } from "@/lib/stores/results-store";
import { draftOf, draggingOf, selectionOf, toReviewOf, type Selection } from "@/lib/stores/view-store";
import type { DraftObstacle } from "@/lib/studio/obstacle-fields";

type Props = { stage: StageStore };

type Of = { selection: Selection | null; draft: DraftObstacle | null; toReview: readonly string[]; project: Project; layout: Layout | null };

/** The words of the callout: of the draft, of the selected obstacle, kept-clear area, module or roof; null where nothing is selected. */
function wordsOf({ selection, draft, toReview, project, layout }: Of): Words | null {
  if (draft) return calloutOfObstacle(draft, "draft");
  if (selection?.kind === "roof") return calloutOfRoof(project.roof.outline);
  if (selection?.kind === "module") {
    const position = layout?.modules[selection.index];
    return position && layout ? calloutOfModule(position, layout.kind) : null;
  }
  if (selection?.kind === "obstacle") {
    const obstacle = project.roof.obstacles[selection.index];
    return obstacle ? calloutOfObstacle(obstacle, toReview.includes(obstacle.name) ? "to-review" : "selected") : null;
  }
  if (selection?.kind === "keepout") {
    const part = layout?.keepout[selection.index];
    const { array } = project;
    return part ? calloutOf(part, { from: array.window_start_h, to: array.window_end_h, allowShaded: array.allow_shaded }) : null;
  }
  return null;
}

/**
 * The callout of what is selected on the roof (docs/design/components.md, "Callout on the stage"): a
 * chip joined to its object by a line and a dot, placed where the Projector says the object falls. For
 * a kept-clear area it says how many positions it keeps clear and what shades it, when; for an obstacle
 * its size and its height; for a draft what adds it; for a module its position and its row; for the roof
 * its size.
 */
export function Callout({ stage }: Props) {
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const toReview = useView(toReviewOf);
  const dragging = useView(draggingOf);
  const project = useProject(projectOf);
  const layout = useResults(layoutOf);
  const hung = useStore(stage, labelsOf).find((label) => label.kind === "callout");

  // While a drag lasts the live label beside the pointer says what changes; the callout waits for the drop.
  if (!project || !hung?.visible || dragging) return null;
  const words = wordsOf({ selection, draft, toReview, project, layout: layout?.layout ?? null });
  if (!words) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-stage-overlay overflow-hidden contain-layout">
      {/* The anchor is a point: the dot is centred on it, the line rises from it, the chip stands on the line
          (docs/design/components.md, "Callout on the stage"). */}
      <div className="placed size-0" style={measures({ x: hung.x, y: hung.y })}>
        <span className="absolute top-0 left-0 block size-2.25 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
        <span className="absolute bottom-0 left-0 block h-10 w-px -translate-x-1/2 bg-accent" />
        <div data-testid="stage-callout" role="status" className="absolute bottom-10 left-0 flex -translate-x-1/2 flex-col gap-0.5 rounded-row border border-note-line bg-surface-1 px-3.5 py-2.5 shadow-float">
          <span className="type-small font-medium whitespace-nowrap text-text">{words.title}</span>
          <span className="type-caption whitespace-nowrap text-text-2">{words.detail}</span>
        </div>
      </div>
    </div>
  );
}
