// How the design is looked at: the lens, the camera, the time of the sun. A store without React.
// Nothing of it is a part of the design: it is not in the .rtd document.
import { createStore } from "zustand/vanilla";
import type { Lens } from "../routes";

/** Where the camera stands (docs/design/guidelines.md, "3D scene"). */
export const CAMERA_PRESETS = ["3d", "plan", "fit", "sun-eye"] as const;
export type CameraPreset = (typeof CAMERA_PRESETS)[number];

export type SunTime = {
  /** Day of the year, or the design day: the winter solstice of the hemisphere. */
  day: number | "design_day";
  /** Hour of the day in solar time: 10.5 is 10:30. */
  hour: number;
};

/** What is selected on the roof: the roof, an obstacle, a kept-clear area or a module, by its index in its list. */
export type Selection = { kind: "roof" } | { kind: "obstacle" | "keepout" | "module"; index: number };

export type ViewState = {
  /** The lens that was opened last. The Studio comes back to it. */
  lens: Lens;
  camera: CameraPreset;
  /** How many times a preset was asked for: the camera frames on each request, also of the same preset (Fit). */
  cameraRequest: number;
  /** How many times north up was asked for: the camera turns on each request. */
  northRequest: number;
  sunTime: SunTime;
  selection: Selection | null;
  /** The obstacles whose height a drawing could not give, by name, until each is typed (decision 13). */
  toReview: string[];
  showLens: (lens: Lens) => void;
  setToReview: (names: readonly string[]) => void;
  reviewed: (name: string) => void;
  select: (selection: Selection | null) => void;
  clearSelection: () => void;
  setCamera: (camera: CameraPreset) => void;
  turnNorthUp: () => void;
  setSunTime: (sunTime: SunTime) => void;
};

export type ViewStore = ReturnType<typeof createViewStore>;

// As the approved mockups open: the first lens, in 3D, the design day at 10:30.
const AT_THE_START = { lens: "roof", camera: "3d", cameraRequest: 0, northRequest: 0, sunTime: { day: "design_day", hour: 10.5 }, selection: null, toReview: [] as string[] } as const;

function refuseWhatIsNoTime({ day, hour }: SunTime): void {
  if (!(hour >= 0 && hour <= 24)) throw new RangeError(`${hour} is no hour of a day: from 0 to 24.`);
  if (day !== "design_day" && !(Number.isInteger(day) && day >= 1 && day <= 366)) {
    throw new RangeError(`${day} is no day of a year: from 1 to 366, or the design day.`);
  }
}

export function createViewStore() {
  return createStore<ViewState>()((set) => ({
    ...AT_THE_START,
    showLens: (lens) => set({ lens }),
    select: (selection) => set({ selection }),
    clearSelection: () => set({ selection: null }),
    setToReview: (names) => set({ toReview: [...names] }),
    reviewed: (name) => set((state) => (state.toReview.includes(name) ? { toReview: state.toReview.filter((one) => one !== name) } : state)),
    setCamera: (camera) => set((state) => ({ camera, cameraRequest: state.cameraRequest + 1 })),
    turnNorthUp: () => set((state) => ({ northRequest: state.northRequest + 1 })),
    setSunTime(sunTime) {
      refuseWhatIsNoTime(sunTime);
      set({ sunTime });
    },
  }));
}

export const lensOf = (state: ViewState) => state.lens;
export const cameraOf = (state: ViewState) => state.camera;
export const cameraRequestOf = (state: ViewState) => state.cameraRequest;
export const northRequestOf = (state: ViewState) => state.northRequest;
export const sunTimeOf = (state: ViewState) => state.sunTime;
export const selectionOf = (state: ViewState) => state.selection;
export const toReviewOf = (state: ViewState) => state.toReview;
