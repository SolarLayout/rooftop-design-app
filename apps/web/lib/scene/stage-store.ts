// What the scene tells the DOM over the stage, frame by frame: where the labels stand and where the
// camera looks. A store without React, written by the Projector on each drawn frame and only when
// something changed, so that React draws nothing for nothing. Nothing of it is a part of the design.
import type { Camera } from "three";
import { createStore } from "zustand/vanilla";
import { sameLabels, type StageLabel } from "./projection";

/** What the ground under the roof is: nothing yet, the plain colour with the grid, or the imagery. */
export type Ground = "none" | "plain" | "imagery";

/** The cursor over the stage: a pointer over what can be selected, a hand over what can be dragged, closed while it is. */
export type Cursor = "default" | "pointer" | "grab" | "grabbing";

/** The strength of each cursor: of several things under the pointer, the strongest shows. */
const STRENGTH: Record<Cursor, number> = { default: 0, pointer: 1, grab: 2, grabbing: 3 };

/** The camera the scene is drawn with, and the size of the canvas in CSS pixels: a pointer on the DOM becomes a ray through them. */
export type CameraOfTheStage = { camera: Camera; width: number; height: number };

export type StageState = {
  labels: StageLabel[];
  /** Where the camera looks, in degrees clockwise from north. */
  bearingDeg: number;
  ground: Ground;
  /** What is under the pointer, by name, with the cursor each asks for. */
  over: Record<string, Cursor>;
  /** The camera of the last drawn frame; null before the first. */
  camera: CameraOfTheStage | null;
  setLabels: (labels: StageLabel[]) => void;
  setBearing: (bearingDeg: number) => void;
  setGround: (ground: Ground) => void;
  /** A thing of the scene says that the pointer came over it and what cursor it wants; null when the pointer left. */
  setOver: (name: string, cursor: Cursor | null) => void;
  setCamera: (camera: Camera, width: number, height: number) => void;
};

export type StageStore = ReturnType<typeof createStageStore>;

/** A bearing is kept to a tenth of a degree: the needle turns by it, the name says whole degrees. */
const tenths = (degrees: number) => Math.round(degrees * 10);

export function createStageStore() {
  return createStore<StageState>()((set, get) => ({
    labels: [],
    bearingDeg: 0,
    ground: "none",
    over: {},
    camera: null,
    setLabels(labels) {
      if (!sameLabels(get().labels, labels)) set({ labels });
    },
    setBearing(bearingDeg) {
      if (tenths(get().bearingDeg) !== tenths(bearingDeg)) set({ bearingDeg });
    },
    setGround(ground) {
      if (get().ground !== ground) set({ ground });
    },
    setOver(name, cursor) {
      const { over } = get();
      if ((over[name] ?? null) === cursor) return;
      const others = Object.fromEntries(Object.entries(over).filter(([other]) => other !== name));
      set({ over: cursor === null ? others : { ...others, [name]: cursor } });
    },
    setCamera(camera, width, height) {
      const before = get().camera;
      if (before && before.camera === camera && before.width === width && before.height === height) return;
      set({ camera: { camera, width, height } });
    },
  }));
}

export const labelsOf = (state: StageState) => state.labels;
export const bearingDegOf = (state: StageState) => state.bearingDeg;
export const groundOf = (state: StageState) => state.ground;
export const cameraOf = (state: StageState) => state.camera;

/** The cursor to show over the stage: the strongest of what is under the pointer. */
export function cursorOf(state: StageState): Cursor {
  return Object.values(state.over).reduce<Cursor>((strongest, cursor) => (STRENGTH[cursor] > STRENGTH[strongest] ? cursor : strongest), "default");
}
