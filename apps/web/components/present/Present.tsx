"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";
import { useSun } from "@/components/scene/use-sun";
import { useStringsShown } from "@/components/scene/use-strings";
import { REDUCED_MOTION, useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { useOpensWhatBelongs } from "@/components/shell/use-opens-what-belongs";
import { useWebGL } from "@/components/find/use-web-gl";
import { PlanFallback } from "@/components/studio/PlanFallback";
import { SunMarks } from "@/components/studio/SunMarks";
import { CONTEXT_LOST, NO_WEBGL } from "@/components/studio/stage-words";
import { attributionOf, stringsWordsOf } from "@/components/studio/stage-view";
import { classNames } from "@/components/ui/class-names";
import { shown } from "@/components/ui/number-entry";
import { CLOCK_OF_THE_BROWSER } from "@/lib/clock";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/places/esri";
import { createControls, isKeysLineShown, keyOf, KEYS_LINE, type Controls } from "@/lib/present/controls";
import { createTour, type Tour } from "@/lib/present/create-tour";
import { factsWordsOf, waitingWordsOf } from "@/lib/present/words";
import { pathOfLens } from "@/lib/routes";
import { createStageStore, groundOf, type StageStore } from "@/lib/scene/stage-store";
import { revealedCountOf } from "@/lib/scene/reveal";
import { hoursOf } from "@/lib/flow/sun-day";
import { nameOf, projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, isDesignUpdating, layoutOf, noOptionsOf, sunDayOf } from "@/lib/stores/results-store";
import { lensOf, presentationOf, sunTimeOf } from "@/lib/stores/view-store";
import { readOutOf } from "@/lib/flow/sun-time";
import { PresentControls } from "./PresentControls";
import { PresentPanel } from "./PresentPanel";

// The scene draws with WebGL in the browser alone: it is loaded there, never on the server.
const Scene = dynamic(() => import("@/components/scene/Scene").then((module) => module.Scene), { ssr: false });

const ATTRIBUTION = esriProvider(KEY_OF_THE_APP)?.imagery.attribution ?? null;

/** What shows the presenter's controls: a move of the pointer, a press, a touch (V2 · 13). */
const SHOWS_THE_CONTROLS = ["pointermove", "pointerdown", "touchstart"] as const;

/**
 * Present (plan/phase-10-plan.md, steps 18 and 19, decisions 8 to 10; V2 · 13, D110): the Studio's scene on the whole
 * screen without the shell's chrome, the tour driving the view store on the app's clock, looping; the scene's panel at
 * the top left, the design and the scene's noun at the bottom left over the stage's fade, the presenter's controls at
 * the foot on a move or a touch, the keys' line at the bottom right on the first loop. Space pauses and plays, ← and →
 * move between scenes, Esc and Leave stop the tour and return to the Studio's last lens; any other key does nothing.
 * A design without a run shows its name and waits, saying why in the words that are already the app's. The browser's
 * full screen is asked for on entry where it is allowed and left on exit, and leaving it leaves Present (its Esc is the
 * browser's); a refusal is nothing. Nothing here asks the API: the design is opened as the shell opens it, and the tour
 * reads the results kept in the stores.
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
  const [controls] = useState(() => createControls({ clock: CLOCK_OF_THE_BROWSER }));
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

  // Leave, Esc or the browser's full screen left: the tour stops and the Studio's last lens comes back, once.
  const left = useRef(false);
  const leave = useCallback(() => {
    if (left.current) return;
    left.current = true;
    tour.stop();
    router.push(pathOfLens(lensOf(view.getState())));
  }, [tour, router, view]);

  // Paused, the controls stay; played, they go 3 s later. A move, a press or a touch shows them.
  const isPaused = useStore(tour.view, (state) => state.isPaused);
  useEffect(() => controls.setPaused(isPaused), [controls, isPaused]);
  useEffect(() => {
    SHOWS_THE_CONTROLS.forEach((event) => window.addEventListener(event, controls.moved));
    return () => {
      SHOWS_THE_CONTROLS.forEach((event) => window.removeEventListener(event, controls.moved));
      controls.stop();
    };
  }, [controls]);

  // The keys: Space, ← and →, Esc; any other key is nothing, so a stray key never ends the tour.
  useEffect(() => {
    function pressed(event: KeyboardEvent) {
      const key = keyOf(event);
      if (key === null) return;
      // Space would also press the control in focus, and scroll.
      event.preventDefault();
      if (key === "leave") return leave();
      if (key === "play-or-pause") return tour.view.getState().isPaused ? tour.play() : tour.pause();
      if (key === "before") tour.before();
      else tour.after();
      controls.moved();
    }
    window.addEventListener("keydown", pressed);
    return () => window.removeEventListener("keydown", pressed);
  }, [tour, controls, leave]);

  // The browser's full screen, where it is allowed; a refusal (no gesture, a policy) is nothing. Its Esc leaves it
  // before the page hears the key: leaving it leaves Present.
  useEffect(() => {
    let isFull = false;
    function changed() {
      if (document.fullscreenElement !== null) isFull = true;
      else if (isFull) leave();
    }
    document.addEventListener("fullscreenchange", changed);
    if (document.fullscreenEnabled && document.fullscreenElement === null) document.documentElement.requestFullscreen().catch(() => undefined);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      if (document.fullscreenElement !== null) document.exitFullscreen().catch(() => undefined);
    };
  }, [leave]);

  return (
    <main aria-label="Present" data-testid="present" data-state={isReady ? "touring" : "waiting"} className="relative h-dvh w-full overflow-hidden bg-ground text-text select-none">
      <div data-testid="stage" data-state={cannotDraw ? "plan" : "scene"} className="absolute inset-0 z-stage">
        {cannotDraw ? (
          project ? <PlanFallback roof={project.roof} layout={layout?.layout ?? null} reason={cannotDraw} /> : null
        ) : (
          <Scene onContextLost={() => setLost(true)} stage={stage} />
        )}
      </div>
      {cannotDraw ? null : <SunMarks stage={stage} callout={false} />}
      <Veil tour={tour} />
      <PresentPanel tour={tour} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-stage-overlay h-45 stage-fade" />
      <Words tour={tour} controls={controls} facts={facts} waiting={waiting} />
      {cannotDraw ? null : <Attribution stage={stage} controls={controls} />}
      <KeysLine tour={tour} controls={controls} />
      <PresentControls tour={tour} controls={controls} onLeave={leave} />
      <OnTheStage tour={tour} stage={stage} />
    </main>
  );
}

// The foot's left moves up over the controls while they are shown (V2 · 13): the words 40 over the foot, 112 over it
// with the bar (120 on phone); the attribution 12 over it, 88 with the bar (96 on phone).
const WORDS_AT = { hidden: "bottom-safe-10", shown: "bottom-safe-30 tablet:bottom-safe-28" } as const;
const ATTRIBUTION_AT = { hidden: "bottom-safe-3", shown: "bottom-safe-24 tablet:bottom-safe-22" } as const;
const useFootAt = (controls: Controls) => (useStore(controls.view, (state) => state.isShown) ? "shown" : "hidden");

/** The words of the moment at the bottom left: the design and its facts, then the scene's noun, or why the tour waits. */
function Words({ tour, controls, facts, waiting }: { tour: Tour; controls: Controls; facts: string; waiting: string | null }) {
  const sceneWords = useStore(tour.view, (state) => state.words);
  const at = useFootAt(controls);
  const line = waiting ?? sceneWords;
  return (
    <div className={classNames("pointer-events-none absolute inset-x-4 z-stage-overlay flex flex-col gap-0.5 transition-all duration-panel ease-out tablet:inset-x-10", WORDS_AT[at])}>
      <p data-testid="present-words" className="type-strong-touch desktop:type-strong text-text">
        {facts}
      </p>
      {line ? (
        <p data-testid="present-scene" className="type-body-touch desktop:type-body text-text-2">
          {line}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The attribution of the imagery at the bottom left, under the words, as the Studio's stage has it: it stands while the
 * imagery is the ground drawn, as the Layers panel asks for it.
 */
function Attribution({ stage, controls }: { stage: StageStore; controls: Controls }) {
  const attribution = attributionOf(useStore(stage, groundOf), ATTRIBUTION);
  const at = useFootAt(controls);
  if (!attribution) return null;
  return (
    <p data-testid="present-attribution" className={classNames("pointer-events-none absolute inset-x-4 z-stage-overlay truncate type-unit text-text-on-imagery on-imagery transition-all duration-panel ease-out tablet:inset-x-10", ATTRIBUTION_AT[at])}>
      {attribution}
    </p>
  );
}

/** The keys at the foot's right on the first loop, while the controls are hidden, on desktop; then gone. */
function KeysLine({ tour, controls }: { tour: Tour; controls: Controls }) {
  const loop = useStore(tour.view, (state) => state.loop);
  const isRunning = useStore(tour.view, (state) => state.isRunning);
  const areControlsShown = useStore(controls.view, (state) => state.isShown);
  const isShown = isRunning && isKeysLineShown({ loop, areControlsShown });
  return (
    <p data-testid="present-keys" data-state={isShown ? "shown" : "faded"} className={classNames("pointer-events-none absolute right-10 bottom-safe-10 z-stage-overlay hidden type-body text-text-2 transition-opacity duration-panel ease-out desktop:block", !isShown && "opacity-gone")}>
      {KEYS_LINE}
    </p>
  );
}

/** Under reduced motion the scenes are stills that change with a fade (V2-103): a veil of the ground going at each change. */
function Veil({ tour }: { tour: Tour }) {
  const index = useStore(tour.view, (state) => state.index);
  const loop = useStore(tour.view, (state) => state.loop);
  const isReduced = useStore(tour.view, (state) => state.isReduced);
  const isRunning = useStore(tour.view, (state) => state.isRunning);
  if (!isReduced || !isRunning) return null;
  return <div key={`${loop}-${index}`} aria-hidden="true" data-testid="present-veil" className="pointer-events-none absolute inset-0 z-stage-overlay bg-ground unveiling" />;
}

/** The text equivalent of the stage under the tour (docs/design/guidelines.md, "Accessibility"): what stands on the roof as far as it is revealed, the time, the strings. */
function OnTheStage({ tour, stage }: { tour: Tour; stage: StageStore }) {
  const scene = useStore(tour.view, (state) => state.scene);
  const into = useStore(tour.view, (state) => state.into);
  const loop = useStore(tour.view, (state) => state.loop);
  const ground = useStore(stage, groundOf);
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
    <ul aria-label="On the roof" className="sr-only" data-scene={scene ?? undefined} data-into={scene ? into : undefined} data-loop={scene ? loop : undefined} data-motion={isReduced ? "reduced" : undefined}>
      {layout ? (
        <li data-testid="present-modules">
          {shown(revealed, 0)} of {shown(modules, 0)} modules in {shown(layout.layout.n_rows, 0)} rows
        </li>
      ) : null}
      {ground === "none" ? null : <li data-testid="present-ground">{ground === "imagery" ? "The ground is the satellite imagery" : "The ground is plain, with a grid"}</li>}
      {sunDay ? <li data-testid="present-sun">{readOutOf(sunDay.dayOfYear, hour, sun)}</li> : null}
      {strings && layout ? (
        <li data-testid="present-strings">{stringsWordsOf({ option: strings.option, strings: strings.strings, colouring: strings.colouring, positions: modules, selected: null }).strings}</li>
      ) : null}
    </ul>
  );
}
