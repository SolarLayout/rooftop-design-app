"use client";

import { useStore } from "zustand";
import { useProject, useView } from "@/components/shell/stores";
import { useSun } from "@/components/scene/use-sun";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { measures } from "@/components/ui/measures";
import { calloutRowOf, calloutSideOf, chipPlaceOf, isMarkRole, isOnTheCanvas } from "@/lib/scene/sun-marks";
import { cameraOf, sunLabelsOf, type StageStore } from "@/lib/scene/stage-store";
import { projectOf } from "@/lib/stores/project-store";
import { draftOf, selectionOf, sunTimeOf } from "@/lib/stores/view-store";
import { sunCalloutOf } from "@/lib/studio/sun-time";

type Props = { stage: StageStore };

// The board "Sun path and shadow outlines": a ring of the sun at each hour mark, and its chip beside it in
// the look of the stage's labels; none on phone.
const RING = "placed hidden size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-outline border-accent bg-ground tablet:block";
const CHIP = "placed hidden -translate-x-1/2 -translate-y-1/2 rounded-xs bg-ground px-1.75 type-tick whitespace-nowrap text-text-2 shadow-tooltip select-none tablet:block";

// The marker: a disc of the sun with its core and its glow, 20 across (14 on phone), the core half of it.
const MARKER = "placed flex size-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent shadow-halo-sun tablet:size-5";
const CORE = "block size-1.75 rounded-full bg-sun-core tablet:size-2.5";

// The callout of the marker (the board "Studio, Sun lens"): joined to the disc's edge by a line of 22 (26 on
// desktop), in the look of the callout of what is selected; on tablet and desktop; under the marker when the
// marker stands in the stage's top, over it in the stage's bottom.
const LINE = { right: "left-2.5", left: "right-2.5" };
const CHIP_SIDE = { right: "left-8 desktop:left-9", left: "right-8 desktop:right-9" };
// Under the marker in the stage's top, over it in its bottom: joined by an upright line of 22.
const ROW_LINE: Partial<Record<"beside" | "below" | "above", string>> = { below: "top-2.5 left-0 h-5.5 w-px", above: "bottom-2.5 left-0 h-5.5 w-px" };
const ROW_CHIP: Partial<Record<"beside" | "below" | "above", string>> = { below: "top-8 left-0 -translate-x-1/2", above: "bottom-8 left-0 -translate-x-1/2" };

/**
 * The sun path's marks over the stage (plan/phase-06-plan.md, decision 10): the marker at the view's
 * hour, the hour marks with their chips, and the marker's callout, each where the scene's projection
 * puts its point. The callout of what is selected wins: while something is selected the marker has none.
 * For the eye alone: the text equivalent of the stage says the sun and its path in words.
 */
export function SunMarks({ stage }: Props) {
  const labels = useStore(stage, sunLabelsOf);
  const canvas = useStore(stage, cameraOf);
  const width = canvas?.width ?? 0;
  const project = useProject(projectOf);
  const { hour } = useView(sunTimeOf);
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const sun = useSun();
  if (labels.length === 0 || !project) return null;
  const marker = labels.find((label) => label.kind === "sun" && label.visible);
  const words = selection === null && draft === null ? sunCalloutOf(hour, sun, { from: project.array.window_start_h, to: project.array.window_end_h }) : null;
  const side = marker ? calloutSideOf(marker.x, width) : "right";
  // In the stage's top the callout would stand under the title and the view controls: it goes under the marker.
  const row = marker && canvas ? calloutRowOf(marker.y, canvas.height) : "beside";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-stage-overlay overflow-hidden contain-layout">
      {labels.map((label) =>
        label.kind === "hour" && label.visible && isMarkRole(label.id) ? (
          <span key={label.id}>
            <span data-testid="sun-hour-mark" className={RING} style={measures({ x: label.x, y: label.y })} />
            <span data-testid="sun-hour" className={CHIP} style={measures(chipPlaceOf(label.id, label.x, label.y))}>
              {label.words}
            </span>
          </span>
        ) : null,
      )}
      {marker ? (
        <span data-testid="sun-marker" className={MARKER} style={measures({ x: marker.x, y: marker.y })}>
          <span className={CORE} />
        </span>
      ) : null}
      {marker && words && canvas && isOnTheCanvas(marker, canvas.width, canvas.height) ? (
        <div className="placed hidden size-0 tablet:block" style={measures({ x: marker.x, y: marker.y })}>
          <span className={classNames("absolute block bg-accent", ROW_LINE[row] ?? classNames("top-0 h-px w-5.5 desktop:w-6.5", LINE[side]))} />
          <div
            data-testid="sun-callout"
            className={classNames(
              "absolute flex flex-col gap-0.5 rounded-row border border-note-line bg-surface-1 px-3.5 py-2.5 shadow-float",
              ROW_CHIP[row] ?? classNames("top-0 -translate-y-1/2", CHIP_SIDE[side]),
            )}
          >
            <span className="flex items-center gap-2 type-small font-medium whitespace-nowrap text-text">
              <Icon name="sun" size={16} className="text-accent" />
              {words.title}
            </span>
            <span className="type-caption whitespace-nowrap text-text-2">{words.detail}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
