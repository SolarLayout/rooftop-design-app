// The tour of Present driven on the app's clock (plan/phase-10-plan.md, step 18, decisions 8 to 10): tick by tick it
// reads the script's state of the moment (tour.ts) and writes it into the view store, which the Studio's scene draws
// from: the camera's step at the start of each scene, the reveal and the colouring as the presentation, the hour of the
// day scene as the sun's time. Looping, until it is stopped; then the view is as it was. Its own view (the scene, the
// words, the energy's count, the loops over) is a store without React for the overlay. The presenter pauses and plays
// it and sends it to a scene, the one before or the one after, each from its beginning (V2 · 13). Made of the view, the
// clock, the day's hours and the motion setting alone, as play is (lib/flow/play.ts): nothing of the API is near it.
import { createStore, type StoreApi } from "zustand/vanilla";
import type { Clock } from "../clock";
import type { DayHours } from "../flow/sun-day";
import type { CameraPreset, ViewStore } from "../stores/view-store";
import { momentOfScene, REDUCED_SCRIPT, sceneAfter, sceneBefore, SCRIPT, stateAt, type Scene, type SceneId, type TourState } from "./tour";

/** Milliseconds between two states written: twenty a second, fine enough for a reveal to be seen moving. */
export const TICK = 50;

type Options = {
  view: ViewStore;
  clock: Clock;
  /** The hours of the day shown; null while its sun has not come, and the hour is held. */
  hoursOf: () => DayHours | null;
  /** Whether the user asks for reduced motion: then the script of cuts. */
  isReduced: () => boolean;
};

/** What the overlay of Present shows of the tour. */
export type TourView = {
  isRunning: boolean;
  /** Paused by the presenter: the moment stands until it plays again. */
  isPaused: boolean;
  /** The scene under way; null while the tour does not run. */
  scene: SceneId | null;
  /** Its place in the script, from 0. */
  index: number;
  words: string;
  /** How far the energy has counted, 0 to 1. */
  figures: number;
  /** How many loops are over. */
  loop: number;
  /** Milliseconds into the scene under way. */
  into: number;
  /** How far into the scene under way, 0 to 1. */
  share: number;
  isReduced: boolean;
};

export type Tour = {
  /** Begins at the first scene; the view's hour and camera of this moment are held and given back at the stop. */
  start: () => void;
  stop: () => void;
  pause: () => void;
  play: () => void;
  /** To scene `index` (from 0) of the loop under way, from its beginning. */
  goTo: (index: number) => void;
  before: () => void;
  after: () => void;
  view: StoreApi<TourView>;
};

const NOT_RUNNING: TourView = { isRunning: false, isPaused: false, scene: null, index: 0, words: "", figures: 0, loop: 0, into: 0, share: 0, isReduced: false };

export function createTour({ view, clock, hoursOf, isReduced }: Options): Tour {
  const shown = createStore<TourView>(() => NOT_RUNNING);
  let giveUpTheTick: (() => void) | null = null;
  /** The hour and the camera as they were when the tour began; null while it does not run. */
  let held: { hour: number; camera: CameraPreset } | null = null;
  let script: readonly Scene[] = SCRIPT;
  let elapsed = 0;
  /** The scene whose camera step was applied last, counted over the loops; −1 for none. */
  let steppedAt = -1;

  function stepTheCamera(state: TourState) {
    const at = state.loop * script.length + state.index;
    if (at === steppedAt) return;
    steppedAt = at;
    const { from, to, over } = state.camera;
    if (from !== null) {
      view.getState().setCamera(from);
      view.getState().setCamera(to, { over });
    } else if (view.getState().camera !== to) {
      view.getState().setCamera(to);
    }
  }

  function apply(state: TourState) {
    stepTheCamera(state);
    view.getState().setPresentation({ reveal: state.reveal, colouring: state.colouring, sunPath: state.sunPath });
    const hour = state.hour ?? held!.hour;
    const { sunTime } = view.getState();
    if (sunTime.hour !== hour) view.getState().setSunTime({ ...sunTime, hour });
    shown.setState({ isRunning: true, scene: state.scene, index: state.index, words: state.words, figures: state.figures, loop: state.loop, into: state.into, share: state.share });
  }

  function tick() {
    apply(stateAt(elapsed, hoursOf(), script));
    if (shown.getState().isPaused) return;
    giveUpTheTick = clock.after(TICK, () => {
      giveUpTheTick = null;
      elapsed += TICK;
      tick();
    });
  }

  function giveUp() {
    giveUpTheTick?.();
    giveUpTheTick = null;
  }

  /** To a moment of the tour, its scene's camera stepped again: playing, the ticks go on from there; paused, it stands there. */
  function jump(to: (t: number) => number) {
    if (!held) return;
    giveUp();
    elapsed = to(elapsed);
    steppedAt = -1;
    tick();
  }

  return {
    start() {
      if (held) return;
      const { sunTime, camera } = view.getState();
      held = { hour: sunTime.hour, camera };
      script = isReduced() ? REDUCED_SCRIPT : SCRIPT;
      elapsed = 0;
      steppedAt = -1;
      shown.setState({ isReduced: script === REDUCED_SCRIPT });
      tick();
    },
    stop() {
      if (!held) return;
      giveUp();
      view.getState().setPresentation(null);
      const { sunTime } = view.getState();
      if (sunTime.hour !== held.hour) view.getState().setSunTime({ ...sunTime, hour: held.hour });
      view.getState().setCamera(held.camera);
      held = null;
      shown.setState(NOT_RUNNING);
    },
    pause() {
      if (!held || shown.getState().isPaused) return;
      giveUp();
      shown.setState({ isPaused: true });
    },
    play() {
      if (!held || !shown.getState().isPaused) return;
      shown.setState({ isPaused: false });
      tick();
    },
    goTo: (index) => jump((t) => momentOfScene(index, t, script)),
    before: () => jump((t) => sceneBefore(t, script)),
    after: () => jump((t) => sceneAfter(t, script)),
    view: shown,
  };
}
