"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useProject, useResults, useView } from "@/components/shell/stores";
import { useWebGL } from "@/components/find/use-web-gl";
import { classNames } from "@/components/ui/class-names";
import { shown } from "@/components/ui/number-entry";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { calloutOf } from "@/lib/scene/keepout";
import { calloutOfObstacle, wordsOf } from "@/lib/scene/obstacles";
import { createStageStore, cursorOf, groundOf, moduleWritesOf, type Cursor, type StageStore } from "@/lib/scene/stage-store";
import type { Lens } from "@/lib/routes";
import { projectOf } from "@/lib/stores/project-store";
import { layoutOf, readoutsOf, sunDayOf } from "@/lib/stores/results-store";
import { draftOf, selectionOf, sunTimeOf, toReviewOf } from "@/lib/stores/view-store";
import { readOutOf } from "@/lib/studio/sun-time";
import { useSun } from "@/components/scene/use-sun";
import { Callout } from "./Callout";
import { Handles } from "./Handles";
import { Labels } from "./Labels";
import { LayoutFailed } from "./LayoutFailed";
import { PlanFallback } from "./PlanFallback";
import { lineOf } from "./stage-view";
import { useEscapeClears } from "./use-escape-clears";
import { ViewControls } from "./ViewControls";

// The scene draws with WebGL in the browser alone: it is loaded there, never on the server.
const Scene = dynamic(() => import("@/components/scene/Scene").then((module) => module.Scene), { ssr: false });

type Props = { lens: Lens; name: string; className?: string };

/** The words the imagery under the roof must carry wherever it is shown (guidelines.md, "3D scene"). */
const ATTRIBUTION = esriProvider(KEY_OF_THE_APP)?.imagery.attribution ?? null;

const NO_WEBGL = "This browser cannot draw the roof in 3D.";
const CONTEXT_LOST = "The browser stopped drawing the roof in 3D.";

/** The view controls stand at the top right of the stage, as the boards of each size place them. */
const VIEW_CONTROLS = "top-1 right-3 tablet:top-4 tablet:right-5 desktop:top-5";

/** The chip of a layout that failed stands under the title, in the middle of the stage: as wide as the board draws it, or as the phone allows. */
const LAYOUT_FAILED = "absolute inset-x-4 top-16 z-stage-overlay tablet:inset-x-0 tablet:top-20 tablet:mx-auto tablet:w-95 desktop:top-24";

/** In development the stage says how often the modules' matrices were written (plan/phase-06-plan.md, decision 6). */
const SAYS_MODULE_WRITES = process.env.NODE_ENV !== "production";

/** The cursor over the scene: a pointer over what can be selected, a hand over what can be dragged (plan step 17). */
const CURSOR: Record<Cursor, string | false> = { default: false, pointer: "cursor-pointer", grab: "cursor-grab", grabbing: "cursor-grabbing" };

/**
 * The stage of the Studio: the 3D scene, the lens's title with its line of read-outs over it, the
 * labels of the roof's edges and the view controls over it, and the text equivalent of what the scene
 * draws (docs/design/guidelines.md, "Accessibility"). While a layout is on its way the line is dimmed
 * with a ring and the modules of before stay; a layout that failed is a chip over the stage (the board
 * "Studio, Array lens, states"). Without WebGL, or once the browser takes the context away, it says so.
 */
export function Stage({ lens, name, className }: Props) {
  const project = useProject(projectOf);
  const obstacles = project?.roof.obstacles.length ?? 0;
  const line = useResults(useShallow((results) => lineOf(lens, results, obstacles)));
  const layout = useResults(layoutOf);
  const webGL = useWebGL();
  const [isLost, setLost] = useState(false);
  // What the scene tells the DOM over it, for this stage alone.
  const [stage] = useState(createStageStore);
  const cursor = useStore(stage, cursorOf);
  const moduleWrites = useStore(stage, moduleWritesOf);
  const cannotDraw = webGL === false ? NO_WEBGL : isLost ? CONTEXT_LOST : null;
  useEscapeClears();

  return (
    <div data-testid="stage" data-state={cannotDraw ? "plan" : "scene"} data-module-writes={SAYS_MODULE_WRITES ? moduleWrites : undefined} className={classNames("relative", className)}>
      <div className={classNames("absolute inset-0 z-stage", CURSOR[cursor])}>
        {cannotDraw ? (
          project ? <PlanFallback roof={project.roof} layout={layout?.layout ?? null} reason={cannotDraw} /> : null
        ) : (
          <Scene onContextLost={() => setLost(true)} stage={stage} />
        )}
      </div>
      {cannotDraw ? null : <Labels stage={stage} />}
      {cannotDraw ? null : <Callout stage={stage} />}
      {cannotDraw ? null : <Handles stage={stage} />}
      <div className="pointer-events-none absolute inset-x-4 top-4 z-stage-overlay flex flex-col gap-0.5 tablet:inset-x-5 desktop:top-5 desktop:left-6">
        <h1 className="sr-only desktop:not-sr-only desktop:type-lens">{name}</h1>
        {line ? (
          <p data-testid="stage-subline" data-state={line.isUpdating ? "updating" : "settled"} className="hidden items-center gap-2 type-small text-text-2 desktop:flex">
            <span className={classNames(line.isUpdating && "opacity-updating")}>{line.words}</span>
            {line.isUpdating ? <ProgressRing size={16} /> : null}
          </p>
        ) : null}
      </div>
      <LayoutFailed className={LAYOUT_FAILED} />
      {cannotDraw ? null : <ViewControls stage={stage} className={VIEW_CONTROLS} />}
      {cannotDraw ? null : ATTRIBUTION ? (
        <p data-testid="stage-attribution" className="pointer-events-none absolute bottom-1 left-4 z-stage-overlay max-w-full truncate type-label-s text-text-on-imagery on-imagery tablet:left-5 desktop:bottom-1.5 desktop:left-6">
          {ATTRIBUTION}
        </p>
      ) : null}
      <OnTheRoof stage={stage} />
    </div>
  );
}

/** The text equivalent of the scene: what stands on the roof, for a screen reader and for the tests. */
function OnTheRoof({ stage }: { stage: StageStore }) {
  const ground = useStore(stage, groundOf);
  const project = useProject(projectOf);
  const readouts = useResults(readoutsOf);
  const layout = useResults(layoutOf);
  const sunDay = useResults(sunDayOf);
  const sun = useSun();
  const { hour } = useView(sunTimeOf);
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const toReview = useView(toReviewOf);
  if (!project) return null;
  const { roof, array } = project;
  const window = { from: array.window_start_h, to: array.window_end_h, allowShaded: array.allow_shaded };
  const selected = selection?.kind === "obstacle" ? selection.index : null;
  const selectedModule = selection?.kind === "module" ? layout?.layout.modules[selection.index] : undefined;
  return (
    <ul aria-label="On the roof" className="sr-only">
      <li data-testid="on-the-roof-roof" aria-current={selection?.kind === "roof" || undefined}>
        Roof, {roof.outline.length} corners{readouts ? `, ${shown(Math.round(readouts.roof_area_m2), 0)} m²` : ""}
        {roof.parapet_h > 0 ? `, parapet ${shown(roof.parapet_h, 1)} m` : ""}
        {selection?.kind === "roof" ? ", selected" : ""}
      </li>
      {roof.obstacles.map((obstacle, index) =>
        obstacle.auto ? null : (
          <li key={index} data-testid="on-the-roof-obstacle" aria-current={selected === index || undefined}>
            {wordsOf(obstacle)}
            {selected === index ? ", selected" : ""}
            {toReview.includes(obstacle.name) ? ", height to review" : ""}
          </li>
        ),
      )}
      {draft ? <li data-testid="on-the-roof-draft">{calloutOfObstacle(draft, "draft").title}</li> : null}
      {layout ? (
        <li data-testid="on-the-roof-modules">
          {shown(layout.layout.modules.length, 0)} modules in {shown(layout.layout.n_rows, 0)} rows
          {selectedModule ? `, position ${shown(selectedModule.idx + 1, 0)} selected` : ""}
        </li>
      ) : null}
      {ground === "none" ? null : (
        <li data-testid="on-the-roof-ground">{ground === "imagery" ? "The ground is the satellite imagery" : "The ground is plain, with a grid"}</li>
      )}
      {sunDay ? <li data-testid="on-the-roof-sun">{readOutOf(sunDay.dayOfYear, hour, sun)}</li> : null}
      {layout?.layout.keepout.map((part, index) => (
        <li key={`keepout-${index}`} data-testid="on-the-roof-keepout">
          {calloutOf(part, window).title}: {calloutOf(part, window).detail}
        </li>
      ))}
    </ul>
  );
}
