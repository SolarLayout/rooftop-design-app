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
import { esriProvider, KEY_OF_THE_APP } from "@/lib/places/esri";
import { calloutOf, hourOf } from "@/lib/geometry/keepout";
import { calloutOfObstacle, wordsOf } from "@/lib/geometry/obstacles";
import { createStageStore, cursorOf, groundOf, moduleWritesOf, type Cursor, type StageStore } from "@/lib/scene/stage-store";
import type { Lens } from "@/lib/routes";
import { projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, designOf, isDesignUpdating, layoutOf, readoutsOf, shadowOutlinesOf, sunDayOf } from "@/lib/stores/results-store";
import { draftOf, isShadeMapShownOf, lensOf, onTheRoofOf, selectionOf, showsSunPathOf, stringsShownByOf, sunTimeOf, toReviewOf } from "@/lib/stores/view-store";
import { shadeMapWordsOf } from "@/lib/scene/shade-map";
import { useShadeMapOfTheRun } from "@/components/scene/use-shade-map";
import { readOutOf, sunLineOf, sunPathLineOf } from "@/lib/flow/sun-time";
import { useSun } from "@/components/scene/use-sun";
import { useStringsShown } from "@/components/scene/use-strings";
import { Callout } from "./Callout";
import { Handles } from "./Handles";
import { Labels } from "./Labels";
import { ShadeLegend } from "./ShadeLegend";
import { StringLegend } from "./StringLegend";
import { SunMarks } from "./SunMarks";
import { LayoutFailed, SunFailed } from "./LayoutFailed";
import { PlanFallback } from "./PlanFallback";
import { lineOf, stringsLineOf, stringsWordsOf } from "./stage-view";
import { CONTEXT_LOST, NO_WEBGL } from "./stage-words";
import { useEscapeClears } from "./use-escape-clears";
import { TimePill, SunTimeline } from "./Time";
import { useSize } from "./use-size";
import { ViewControls } from "./ViewControls";

// The scene draws with WebGL in the browser alone: it is loaded there, never on the server.
const Scene = dynamic(() => import("@/components/scene/Scene").then((module) => module.Scene), { ssr: false });

type Props = { lens: Lens; name: string; className?: string };

/** The words the imagery under the roof must carry wherever it is shown (guidelines.md, "3D scene"). */
const ATTRIBUTION = esriProvider(KEY_OF_THE_APP)?.imagery.attribution ?? null;

/** The view controls stand at the top right of the stage, as the boards of each size place them. */
const VIEW_CONTROLS = "top-1 right-3 tablet:top-4 tablet:right-5 desktop:top-5";

/**
 * The time on the stage (the boards "Time on the stage" and "Studio, Sun lens"): the pill of every lens at the
 * top left on phone, at the bottom left of the stage on tablet, over the vitals on desktop (the panel's 20,
 * the vitals' 78 and 18 between: 116); the timeline of the Sun lens across the stage there instead. On tablet
 * both stand 28 over the stage's bottom, so that the imagery's attribution under them stays clear.
 */
const TIME_PILL = "absolute top-1 left-3 z-stage-overlay tablet:top-auto tablet:bottom-7 tablet:left-5 desktop:bottom-29 desktop:left-6";
const TIMELINE = "absolute inset-x-5 bottom-7 z-stage-overlay desktop:bottom-29";

/** The legend of the shade map: 12 over the timeline on tablet and desktop; on phone at the stage's bottom left, over the attribution. */
const SHADE_LEGEND = "absolute bottom-7 left-3 z-stage-overlay tablet:bottom-26 tablet:left-5 desktop:bottom-48";

/**
 * The strings' colour switch and legend (the boards "Studio, Strings lens" on three sizes): 12 over the time pill on
 * desktop (the pill's 116 and 44: 172), at the bottom right on tablet and at the bottom left on phone, 28 over the
 * stage's bottom there, so that the imagery's attribution under it stays clear.
 */
const STRING_LEGEND = "absolute bottom-7 left-3 z-stage-overlay tablet:right-5 tablet:left-auto desktop:right-auto desktop:bottom-43 desktop:left-6";

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
  const layoutLine = useResults(useShallow((results) => lineOf(lens, results, obstacles)));
  const sunDay = useResults(sunDayOf);
  // The Sun lens's line says the day and the window (the board "Studio, Sun lens"), once the day has come.
  const design = useResults(designOf);
  const option = useResults(chosenOptionOf);
  const positions = useResults((results) => readoutsOf(results)?.positions ?? null);
  const isRunning = useResults(isDesignUpdating);
  // The Strings lens's line says the chosen option's strings, or why there are none (plan/phase-07-plan.md, decision 14).
  const stringsWords = stringsLineOf({ positions, mppts: design?.equipment.inverter.n_mppt ?? null, option, noOptions: design?.no_options?.code ?? null });
  const line =
    lens === "sun"
      ? sunDay && project
        ? { words: sunLineOf(sunDay.dayOfYear, project.roof.lat, { from: project.array.window_start_h, to: project.array.window_end_h }), isUpdating: false }
        : null
      : lens === "strings"
        ? stringsWords === null
          ? null
          : { words: stringsWords, isUpdating: isRunning }
        : layoutLine;
  const layout = useResults(layoutOf);
  const webGL = useWebGL();
  const [isLost, setLost] = useState(false);
  // What the scene tells the DOM over it, for this stage alone.
  const [stage] = useState(createStageStore);
  const cursor = useStore(stage, cursorOf);
  const moduleWrites = useStore(stage, moduleWritesOf);
  const cannotDraw = webGL === false ? NO_WEBGL : isLost ? CONTEXT_LOST : null;
  const size = useSize();
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
      {cannotDraw ? null : <SunMarks stage={stage} />}
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
      <SunFailed className={LAYOUT_FAILED} />
      {cannotDraw ? null : <ViewControls stage={stage} className={VIEW_CONTROLS} />}
      {cannotDraw || size === null ? null : lens === "sun" && size !== "phone" ? <SunTimeline size={size} className={TIMELINE} /> : <TimePill size={size} className={TIME_PILL} />}
      {cannotDraw || size === null ? null : <ShadeLegend size={size} className={SHADE_LEGEND} />}
      {cannotDraw || size === null ? null : <StringLegend size={size} className={STRING_LEGEND} />}
      {cannotDraw ? null : ATTRIBUTION ? (
        <p data-testid="stage-attribution" className="pointer-events-none absolute bottom-1 left-4 z-stage-overlay max-w-full truncate type-label-s text-text-on-imagery on-imagery tablet:left-5 desktop:bottom-1.5 desktop:left-6">
          {ATTRIBUTION}
        </p>
      ) : null}
      <OnTheRoof stage={stage} isScene={!cannotDraw} />
    </div>
  );
}

/** The text equivalent of the scene: what stands on the roof, for a screen reader and for the tests. */
function OnTheRoof({ stage, isScene }: { stage: StageStore; isScene: boolean }) {
  const ground = useStore(stage, groundOf);
  const project = useProject(projectOf);
  const readouts = useResults(readoutsOf);
  const layout = useResults(layoutOf);
  const sunDay = useResults(sunDayOf);
  const sun = useSun();
  const { hour } = useView(sunTimeOf);
  const outlines = useResults(shadowOutlinesOf);
  const onTheRoof = useView(onTheRoofOf);
  const lens = useView(lensOf);
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const toReview = useView(toReviewOf);
  const showsSunPath = useView(showsSunPathOf);
  const isShadeMapShown = useView(isShadeMapShownOf);
  const shadeMap = useShadeMapOfTheRun();
  const strings = useStringsShown();
  const stringsShownBy = useView(stringsShownByOf);
  const option = useResults(chosenOptionOf);
  const isWindowThick = onTheRoof.window;
  if (!project) return null;
  const { roof, array } = project;
  const window = { from: array.window_start_h, to: array.window_end_h, allowShaded: array.allow_shaded };
  // The sun path as the scene draws it: in the Sun lens, while its switch is on, the window thicker while that is on.
  const sunPath = isScene && showsSunPath && sunDay ? sunPathLineOf(sunDay, isWindowThick ? window : null) : null;
  const selected = selection?.kind === "obstacle" ? selection.index : null;
  const selectedModule = selection?.kind === "module" ? layout?.layout.modules[selection.index] : undefined;
  // The strings on the roof, in the Strings lens while the run has an option (plan/phase-07-plan.md, step 16).
  const stringsWords =
    strings && layout
      ? stringsWordsOf({ option: strings.option, strings: strings.strings, colouring: strings.colouring, positions: layout.layout.modules.length, selected: selection?.kind === "string" ? selection.label : null })
      : null;
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
      {sunPath ? <li data-testid="on-the-roof-sun-path">{sunPath}</li> : null}
      {isShadeMapShown ? <li data-testid="on-the-roof-shade-map">{shadeMapWordsOf(shadeMap)}</li> : null}
      {stringsWords ? (
        <>
          <li data-testid="on-the-roof-strings">
            {stringsWords.strings}
          </li>
          <li data-testid="on-the-roof-unused">{stringsWords.unused}</li>
          <li data-testid="on-the-roof-inverters">{stringsWords.inverters}</li>
          {stringsWords.selected ? (
            <li data-testid="on-the-roof-string-selected" aria-current>
              {stringsWords.selected}
            </li>
          ) : null}
        </>
      ) : stringsShownBy && option ? (
        <li data-testid="on-the-roof-strings">The strings follow the design run</li>
      ) : null}
      {outlines && onTheRoof.shadowOutlines && lens === "sun" ? (
        <li data-testid="on-the-roof-shadow-outlines">
          {`The engine's shadow outlines at ${hourOf(outlines.hour)}: ${outlines.polygons.length} ${outlines.polygons.length === 1 ? "polygon" : "polygons"}`}
        </li>
      ) : null}
      {layout?.layout.keepout.map((part, index) => (
        <li key={`keepout-${index}`} data-testid="on-the-roof-keepout">
          {calloutOf(part, window).title}: {calloutOf(part, window).detail}
        </li>
      ))}
    </ul>
  );
}
