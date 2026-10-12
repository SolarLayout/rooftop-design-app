// The tour of Present (plan/phase-10-plan.md, step 16, decision 9; V2 · 13, D110): six scenes in order, each with its
// name, its length and what it sets at a moment of itself: where the camera stands and whether it moves there, how far
// the building, the obstacles and the modules are revealed, the hour of the day, what the strings are coloured by, how
// far the energy has counted, and the noun the line at the foot says of it. The whole state at a moment of the loop is
// `stateAt`; the moments the presenter goes to are `sceneBefore`, `sceneAfter` and `momentOfScene`. Under reduced motion
// each scene is a still held for its time (V2-103). Pure: the clock and the stores are the driver's.
import type { Colouring } from "../stores/string-colours";
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
  /** The scene's name: the panel's head, the track's segment. */
  name: string;
  /** What the scene shows, as a noun, for the line at the foot (V2-40). */
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
  /** Whether the stage draws the sun path, the sun moving along it with the hour (the day scene alone, D72). */
  sunPath: boolean;
};

export type TourState = {
  scene: SceneId;
  /** The scene's place in the script, from 0. */
  index: number;
  words: string;
  /** Milliseconds into the scene. */
  into: number;
  /** How far into the scene, from 0 to 1: what the figures of its panel count with (D72). */
  share: number;
  camera: CameraStep;
  reveal: Reveal;
  /** The hour of the day in solar time; null for the hour held as it was. */
  hour: number | null;
  colouring: Colouring | null;
  figures: number;
  sunPath: boolean;
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
    name: "The place",
    words: "The roof from above",
    duration: 4000,
    camera: { from: "plan", to: "3d", over: 4000 },
    revealAt: () => NOTHING,
    dayAt: held,
    colouring: null,
    figuresAt: nothingCounted,
    sunPath: false,
  },
  {
    id: "rising",
    name: "The roof",
    words: "The roof in 3D",
    duration: 4000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: (share) => ({ building: between(share, 0, 0.5), obstacles: between(share, 0.5, 1), modules: 0 }),
    dayAt: held,
    colouring: null,
    figuresAt: nothingCounted,
    sunPath: false,
  },
  {
    id: "filling",
    name: "The array",
    words: "The array",
    duration: 6000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: (share) => ({ building: 1, obstacles: 1, modules: clamp(share) }),
    dayAt: held,
    colouring: null,
    figuresAt: nothingCounted,
    sunPath: false,
  },
  {
    id: "day",
    name: "The sun",
    words: "Shadows over the day",
    duration: 12000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: () => EVERYTHING,
    dayAt: (share) => clamp(share),
    colouring: null,
    figuresAt: nothingCounted,
    sunPath: true,
  },
  {
    id: "strings",
    name: "The strings",
    words: "The strings",
    duration: 4000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: () => EVERYTHING,
    dayAt: held,
    colouring: "mppt",
    figuresAt: nothingCounted,
    sunPath: false,
  },
  {
    id: "energy",
    name: "The energy",
    words: "Energy over the year",
    duration: 10000,
    camera: { from: null, to: "3d", over: 0 },
    revealAt: () => EVERYTHING,
    dayAt: held,
    colouring: "mppt",
    figuresAt: (share) => between(share, 0, COUNTING_SHARE),
    sunPath: false,
  },
];

export const SCRIPT: readonly Scene[] = SCENES;

/** The length of one loop, in milliseconds. */
export const LOOP = SCENES.reduce((sum, scene) => sum + scene.duration, 0);

/**
 * The same scenes as stills held for their time (V2-103): the camera cut to the plan and then to 3D, never moved; the
 * building, the obstacles and the modules whole from the start of their scenes; the day at the hour the Studio holds,
 * under its sun's arc; the energy at its number.
 */
export function reducedMotionScript(script: readonly Scene[]): Scene[] {
  return script.map((scene) => {
    const camera: CameraStep = scene.camera.from === null ? scene.camera : { from: null, to: scene.camera.from, over: 0 };
    return {
      ...scene,
      camera,
      revealAt: () => scene.revealAt(1),
      dayAt: held,
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
    share,
    camera: scene.camera,
    reveal: scene.revealAt(share),
    hour: day === null || hours === null ? null : hours.from + (hours.to - hours.from) * day,
    colouring: scene.colouring,
    figures: scene.figuresAt(share),
    sunPath: scene.sunPath,
    loop,
  };
}

const lengthOf = (script: readonly Scene[]) => script.reduce((sum, scene) => sum + scene.duration, 0);

/** The moment scene `index` begins in the loop under way at `t`. */
export function momentOfScene(index: number, t: number, script: readonly Scene[] = SCRIPT): number {
  const length = lengthOf(script);
  const begins = script.slice(0, index).reduce((sum, scene) => sum + scene.duration, 0);
  return Math.floor(t / length) * length + begins;
}

/** The moment the scene after the one under way at `t` begins: after the last, the first of the next loop. */
export function sceneAfter(t: number, script: readonly Scene[] = SCRIPT): number {
  const { index } = stateAt(t, null, script);
  return index === script.length - 1 ? momentOfScene(0, t, script) + lengthOf(script) : momentOfScene(index + 1, t, script);
}

/** The moment the scene before the one under way at `t` begins: before the first, the last of the loop before (of this one in the first). */
export function sceneBefore(t: number, script: readonly Scene[] = SCRIPT): number {
  const { index, loop } = stateAt(t, null, script);
  if (index > 0) return momentOfScene(index - 1, t, script);
  const last = momentOfScene(script.length - 1, t, script);
  return loop === 0 ? last : last - lengthOf(script);
}
