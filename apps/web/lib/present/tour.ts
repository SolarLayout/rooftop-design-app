// The tour of Present (plan/phase-10-plan.md, step 16, decision 9; the board "Present"): six scenes in order,
// each with its length and what it sets at a moment of itself: where the camera stands and whether it moves
// there, how far the building, the obstacles and the modules are revealed, the hour of the day, what the
// strings are coloured by, how far the energy has counted, and the scene's words for the overlay. The whole
// state at a moment of the loop is `stateAt`. Under reduced motion each scene is a cut held for its time
// (docs/design/guidelines.md, "Accessibility"). Pure: the clock and the stores are the driver's.
import type { Colouring } from "../scene/string-colours";
import type { DayHours } from "../flow/sun-day";
import type { CameraPreset } from "../stores/view-store";

export type SceneId = "satellite" | "rising" | "filling" | "day" | "strings" | "energy";

/** How far each part of the design stands revealed, as a share from 0 to 1. */
export type Reveal = { building: number; obstacles: number; modules: number };

/**
 * The camera at a scene's start: the preset it goes `to`; `from` the preset it is set to first when it moves there
 * over `over` milliseconds (0: a cut to `to`, when it is not there already).
 */
export type CameraStep = { from: CameraPreset | null; to: CameraPreset; over: number };

/** A scene: what it sets at a share of itself from 0 to 1. */
export type Scene = {
  id: SceneId;
  words: string;
  /** Milliseconds. */
  duration: number;
  camera: CameraStep;
  revealAt: (share: number) => Reveal;
  /** The hour as a share of the day's hours, sunrise 0 and sunset 1; null for the hour held as it was. */
  dayAt: (share: number) => number | null;
  colouring: Colouring | null;
  /** How far the energy has counted, from 0 to 1. */
  figuresAt: (share: number) => number;
};

export type TourState = {
  scene: SceneId;
  /** The scene's place in the script, from 0. */
  index: number;
  words: string;
  /** Milliseconds into the scene. */
  into: number;
  camera: CameraStep;
  reveal: Reveal;
  /** The hour of the day in solar time; null for the hour held as it was. */
  hour: number | null;
  colouring: Colouring | null;
  figures: number;
  /** How many loops are over. */
  loop: number;
};

const clamp = (share: number) => Math.min(1, Math.max(0, share));

/** A share of the scene from `from` to `to` of it, as a share from 0 to 1. */
const between = (share: number, from: number, to: number) => clamp((share - from) / (to - from));

const NOTHING: Reveal = { building: 0, obstacles: 0, modules: 0 };
const EVERYTHING: Reveal = { building: 1, obstacles: 1, modules: 1 };
const held = () => null;
const nothingCounted = () => 0;
const everythingCounted = () => 1;

/** The energy counts over the first six seconds of its ten, then is held. */
const COUNTING_SHARE = 6 / 10;

export const SCENES: readonly Scene[] = [
  {
    id: "satellite",
    words: "The satellite from above tilts into 3D",
    duration: 4000,
    camera: { from: "plan", to: "3d", over: 4000 },
    revealAt: () => NOTHING,
    dayAt: held,
    colouring: null,
    figuresAt: nothingCounted,
  },
  {
    id: "rising",
    words: "The building and the obstacles rise",
    duration: 4000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: (share) => ({ building: between(share, 0, 0.5), obstacles: between(share, 0.5, 1), modules: 0 }),
    dayAt: held,
    colouring: null,
    figuresAt: nothingCounted,
  },
  {
    id: "filling",
    words: "The modules fill row by row",
    duration: 6000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: (share) => ({ building: 1, obstacles: 1, modules: clamp(share) }),
    dayAt: held,
    colouring: null,
    figuresAt: nothingCounted,
  },
  {
    id: "day",
    words: "The day plays with its shadows",
    duration: 12000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: () => EVERYTHING,
    dayAt: (share) => clamp(share),
    colouring: null,
    figuresAt: nothingCounted,
  },
  {
    id: "strings",
    words: "The strings light up by MPPT",
    duration: 4000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: () => EVERYTHING,
    dayAt: held,
    colouring: "mppt",
    figuresAt: nothingCounted,
  },
  {
    id: "energy",
    words: "The energy counts up",
    duration: 10000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: () => EVERYTHING,
    dayAt: held,
    colouring: "mppt",
    figuresAt: (share) => between(share, 0, COUNTING_SHARE),
  },
];

export const SCRIPT: readonly Scene[] = SCENES;

/** The length of one loop, in milliseconds. */
export const LOOP = SCENES.reduce((sum, scene) => sum + scene.duration, 0);

/** Under reduced motion the day goes in this many cuts: an hour of the demo's day about every second, as play does. */
const DAY_CUTS = 12;

/**
 * The same scenes as cuts held for their time: the camera cut to the plan and then to 3D, the building and the
 * obstacles and the modules whole from the start of their scenes, the day in cuts, the energy at its number.
 */
export function reducedMotionScript(script: readonly Scene[]): Scene[] {
  return script.map((scene) => {
    const camera: CameraStep = scene.camera.from === null ? scene.camera : { from: null, to: scene.camera.from, over: 0 };
    return {
      ...scene,
      camera,
      revealAt: () => scene.revealAt(1),
      dayAt: (share) => {
        const whole = scene.dayAt(share);
        return whole === null ? null : Math.floor(whole * DAY_CUTS) / DAY_CUTS;
      },
      figuresAt: everythingCounted,
    };
  });
}

export const REDUCED_SCRIPT: readonly Scene[] = reducedMotionScript(SCENES);

/** The whole state of the tour at `t` milliseconds since it began, looping; the day's hours give the hour of the day scene. */
export function stateAt(t: number, hours: DayHours | null, script: readonly Scene[] = SCRIPT): TourState {
  if (!(t >= 0)) throw new RangeError(`${t} is no moment of the tour: it begins at 0.`);
  const length = script.reduce((sum, scene) => sum + scene.duration, 0);
  const loop = Math.floor(t / length);
  let into = t - loop * length;
  let index = 0;
  while (into >= script[index]!.duration && index < script.length - 1) {
    into -= script[index]!.duration;
    index += 1;
  }
  const scene = script[index]!;
  const share = into / scene.duration;
  const day = scene.dayAt(share);
  return {
    scene: scene.id,
    index,
    words: scene.words,
    into,
    camera: scene.camera,
    reveal: scene.revealAt(share),
    hour: day === null || hours === null ? null : hours.from + (hours.to - hours.from) * day,
    colouring: scene.colouring,
    figures: scene.figuresAt(share),
    loop,
  };
}
