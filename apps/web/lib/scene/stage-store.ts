// What the scene tells the DOM over the stage, frame by frame: where the labels stand and where the
// camera looks. A store without React, written by the Projector on each drawn frame and only when
// something changed, so that React draws nothing for nothing. Nothing of it is a part of the design.
import { createStore } from "zustand/vanilla";
import { sameLabels, type StageLabel } from "./projection";

/** What the ground under the roof is: nothing yet, the plain colour with the grid, or the imagery. */
export type Ground = "none" | "plain" | "imagery";

export type StageState = {
  labels: StageLabel[];
  /** Where the camera looks, in degrees clockwise from north. */
  bearingDeg: number;
  ground: Ground;
  setLabels: (labels: StageLabel[]) => void;
  setBearing: (bearingDeg: number) => void;
  setGround: (ground: Ground) => void;
};

export type StageStore = ReturnType<typeof createStageStore>;

/** A bearing is kept to a tenth of a degree: the needle turns by it, the name says whole degrees. */
const tenths = (degrees: number) => Math.round(degrees * 10);

export function createStageStore() {
  return createStore<StageState>()((set, get) => ({
    labels: [],
    bearingDeg: 0,
    ground: "none",
    setLabels(labels) {
      if (!sameLabels(get().labels, labels)) set({ labels });
    },
    setBearing(bearingDeg) {
      if (tenths(get().bearingDeg) !== tenths(bearingDeg)) set({ bearingDeg });
    },
    setGround(ground) {
      if (get().ground !== ground) set({ ground });
    },
  }));
}

export const labelsOf = (state: StageState) => state.labels;
export const bearingDegOf = (state: StageState) => state.bearingDeg;
export const groundOf = (state: StageState) => state.ground;
