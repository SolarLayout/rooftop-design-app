"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";
import { useSun } from "@/components/scene/use-sun";
import { useStringsShown } from "@/components/scene/use-strings";
import { REDUCED_MOTION, useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { useOpensWhatBelongs } from "@/components/shell/use-opens-what-belongs";
import { useWebGL } from "@/components/find/use-web-gl";
import { PlanFallback } from "@/components/studio/PlanFallback";
import { CONTEXT_LOST, NO_WEBGL } from "@/components/studio/Stage";
import { stringsWordsOf } from "@/components/studio/stage-view";
import { classNames } from "@/components/ui/class-names";
import { shown } from "@/components/ui/number-entry";
import { CLOCK_OF_THE_BROWSER } from "@/lib/clock";
import { createTour, type Tour } from "@/lib/present/create-tour";
import { factsWordsOf, waitingWordsOf } from "@/lib/present/words";
import { pathOfLens } from "@/lib/routes";
import { createStageStore } from "@/lib/scene/stage-store";
import { revealedCountOf } from "@/lib/scene/reveal";
import { hoursOf } from "@/lib/scene/sun-day";
import { nameOf, projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, isDesignUpdating, layoutOf, noOptionsOf, sunDayOf } from "@/lib/stores/results-store";
import { lensOf, presentationOf, sunTimeOf } from "@/lib/stores/view-store";
import { readOutOf } from "@/lib/studio/sun-time";

// The scene draws with WebGL in the browser alone: it is loaded there, never on the server.
const Scene = dynamic(() => import("@/components/scene/Scene").then((module) => module.Scene), { ssr: false });

/** The hint at the bottom right (the board "Present"), fading after the first loop. */
const HINT = "Press any key or touch the screen to return";

/** What leaves Present: any key, any press of a pointer, any touch (decision 8). */
const LEAVES = ["keydown", "pointerdown", "touchstart"] as const;

/**
 * Present (plan/phase-10-plan.md, steps 18 and 19, decisions 8 to 10; the board "Present"): the Studio's scene on the
 * whole screen without the shell's chrome, the tour driving the view store on the app's clock, looping; the words of the
 * moment at the bottom left over the stage's fade, the hint at the bottom right. Any key, pointer or touch stops the
 * tour and returns to the Studio's last lens. A design without a run shows its name and waits, saying why in the words
 * that are already the app's. The browser's full screen is asked for on entry where it is allowed and left on exit; a
 * refusal is nothing. Nothing here asks the API: the design is opened as the shell opens it, and the tour reads the
 * results kept in the stores.
 */
export function Present() {
  const { view, results, play } = useStores();
  const router = useRouter();
  useOpensWhatBelongs();
  const project = useProject(projectOf);
  const name = useProject(nameOf);
  const layout = useResults(layoutOf);
  const sunDay = useResults(sunDayOf);
  const option = useResults(chosenOptionOf);
  const isUpdating = useResults(isDesignUpdating);
  const noOptions = useResults(noOptionsOf);
  const webGL = useWebGL();
  const [isLost, setLost] = useState(false);
  const [stage] = useState(createStageStore);
  const cannotDraw = webGL === false ? NO_WEBGL : isLost ? CONTEXT_LOST : null;
  const tour = useMemo(
    () =>
      createTour({
        view,
        clock: CLOCK_OF_THE_BROWSER,
        hoursOf: () => {
          const day = sunDayOf(results.getState());
          return day ? hoursOf(day) : null;
        },
        isReduced: () => window.matchMedia(REDUCED_MOTION).matches,
      }),
    [view, results],
  );
  // The tour needs the layout, the day's sun and the chosen option: until they are there it waits and says why.
  const isReady = layout !== null && sunDay !== null && option !== null;
  const facts = factsWordsOf({ name: name ?? "", dcKwp: option?.dc_kwp ?? null, energyMwh: option?.energy.energy_mwh ?? null });
  const waiting = isReady ? null : waitingWordsOf({ isUpdating, noOptions });

  useEffect(() => {
    if (!isReady) return;
    // The time played in the Studio would move the hour under the tour.
    play.pause();
    tour.start();
    return () => tour.stop();
  }, [isReady, tour, play]);

  // Any key, pointer or touch leaves, once: a touch comes as a pointer too.
  const left = useRef(false);
  useEffect(() => {
    function leave() {
      if (left.current) return;
      left.current = true;
      tour.stop();
      router.push(pathOfLens(lensOf(view.getState())));
    }
    LEAVES.forEach((event) => window.addEventListener(event, leave));
    return () => LEAVES.forEach((event) => window.removeEventListener(event, leave));
  }, [tour, router, view]);

  // The browser's full screen, where it is allowed; a refusal (no gesture, a policy) is nothing.
  useEffect(() => {
    if (document.fullscreenEnabled && document.fullscreenElement === null) document.documentElement.requestFullscreen().catch(() => undefined);
    return () => {
      if (document.fullscreenElement !== null) document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  return (
    <main aria-label="Present" data-testid="present" data-state={isReady ? "touring" : "waiting"} className="relative h-dvh w-full overflow-hidden bg-ground text-text select-none">
      <div data-testid="stage" data-state={cannotDraw ? "plan" : "scene"} className="absolute inset-0 z-stage">
        {cannotDraw ? (
          project ? <PlanFallback roof={project.roof} layout={layout?.layout ?? null} reason={cannotDraw} /> : null
        ) : (
          <Scene onContextLost={() => setLost(true)} stage={stage} />
        )}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-stage-overlay h-45 stage-fade" />
      <Words tour={tour} facts={facts} waiting={waiting} />
      <Hint tour={tour} />
      <OnTheStage tour={tour} />
    </main>
  );
}

/** The words of the moment at the bottom left: the design and its facts, then the scene's words, or why the tour waits. */
function Words({ tour, facts, waiting }: { tour: Tour; facts: string; waiting: string | null }) {
  const sceneWords = useStore(tour.view, (state) => state.words);
  const line = waiting ?? sceneWords;
  return (
    <div className="pointer-events-none absolute bottom-7 left-10 z-stage-overlay flex flex-col gap-0.5">
      <p data-testid="present-words" className="type-small text-text-2">
        {facts}
      </p>
      {line ? (
        <p data-testid="present-scene" className="type-caption text-text-3">
          {line}
        </p>
      ) : null}
    </div>
  );
}

/** The hint at the bottom right, fading once the first loop is over. */
function Hint({ tour }: { tour: Tour }) {
  const loop = useStore(tour.view, (state) => state.loop);
  return (
    <p data-testid="present-hint" data-state={loop > 0 ? "faded" : "shown"} className={classNames("pointer-events-none absolute right-10 bottom-7 z-stage-overlay type-caption text-text-3 transition-opacity duration-panel ease-out", loop > 0 && "opacity-gone")}>
      {HINT}
    </p>
  );
}

/** The text equivalent of the stage under the tour (docs/design/guidelines.md, "Accessibility"): what stands on the roof as far as it is revealed, the time, the strings. */
function OnTheStage({ tour }: { tour: Tour }) {
  const scene = useStore(tour.view, (state) => state.scene);
  const isReduced = useStore(tour.view, (state) => state.isReduced);
  const layout = useResults(layoutOf);
  const sunDay = useResults(sunDayOf);
  const sun = useSun();
  const { hour } = useView(sunTimeOf);
  const presentation = useView(presentationOf);
  const strings = useStringsShown();
  const modules = layout?.layout.modules.length ?? 0;
  const revealed = revealedCountOf(modules, presentation?.reveal.modules ?? 1);
  return (
    <ul aria-label="On the roof" className="sr-only" data-scene={scene ?? undefined} data-motion={isReduced ? "reduced" : undefined}>
      {layout ? (
        <li data-testid="present-modules">
          {shown(revealed, 0)} of {shown(modules, 0)} modules in {shown(layout.layout.n_rows, 0)} rows
        </li>
      ) : null}
      {sunDay ? <li data-testid="present-sun">{readOutOf(sunDay.dayOfYear, hour, sun)}</li> : null}
      {strings && layout ? (
        <li data-testid="present-strings">{stringsWordsOf({ option: strings.option, strings: strings.strings, colouring: strings.colouring, positions: modules, selected: null }).strings}</li>
      ) : null}
    </ul>
  );
}
