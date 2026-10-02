// How the design is looked at: the lens, the camera, the time of the sun. A store without React.
// Nothing of it is a part of the design: it is not in the .rtd document.
import { createStore } from "zustand/vanilla";
import type { Lens } from "../routes";
import { sameObstacle, type Dragging } from "../scene/drag";
import type { DraftObstacle } from "../studio/obstacle-fields";

/** Where the camera stands (docs/design/guidelines.md, "3D scene"). */
export const CAMERA_PRESETS = ["3d", "plan", "fit", "sun-eye"] as const;
export type CameraPreset = (typeof CAMERA_PRESETS)[number];

export type SunTime = {
  /** Day of the year, or the design day: the winter solstice of the hemisphere. */
  day: number | "design_day";
  /** Hour of the day in solar time: 10.5 is 10:30. */
  hour: number;
};

/**
 * What the Sun lens draws on the roof (plan/phase-06-plan.md, decision 16): the sun path, its shade-free
 * window's part thicker, and the engine's shadow outlines. Of the view, not of the design.
 */
export type OnTheRoof = { sunPath: boolean; window: boolean; shadowOutlines: boolean };

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
  /** Whether the time plays (plan/phase-06-plan.md, decision 4): of the view, as the time is. */
  isPlaying: boolean;
  onTheRoof: OnTheRoof;
  selection: Selection | null;
  /**
   * A new obstacle before its height is typed (decision 15): of the view until then, and the one thing
   * that is open while it stands. A selection drops it.
   */
  draft: DraftObstacle | null;
  /** The obstacles whose height a drawing could not give, by name, until each is typed (decision 13). */
  toReview: string[];
  /** An obstacle while the pointer drags it, as the pointer has it (decision 12); null while none is. */
  dragging: Dragging | null;
  showLens: (lens: Lens) => void;
  setToReview: (names: readonly string[]) => void;
  reviewed: (name: string) => void;
  select: (selection: Selection | null) => void;
  /** Clears what is selected and drops the draft. */
  clearSelection: () => void;
  setDraft: (draft: DraftObstacle | null) => void;
  /** The drag as it is now; the same obstacle told again changes nothing. Null when the drag is over. */
  setDragging: (dragging: Dragging | null) => void;
  setCamera: (camera: CameraPreset) => void;
  turnNorthUp: () => void;
  setSunTime: (sunTime: SunTime) => void;
  setPlaying: (isPlaying: boolean) => void;
  showOnTheRoof: (what: keyof OnTheRoof, on: boolean) => void;
};

export type ViewStore = ReturnType<typeof createViewStore>;

// As the approved mockups open: the first lens, in 3D, the design day at 10:30.
const AT_THE_START = { lens: "roof", camera: "3d", cameraRequest: 0, northRequest: 0, sunTime: { day: "design_day", hour: 10.5 }, isPlaying: false, onTheRoof: { sunPath: true, window: true, shadowOutlines: false }, selection: null, draft: null, toReview: [] as string[], dragging: null } as const;

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
    select: (selection) => set({ selection, draft: null }),
    clearSelection: () => set({ selection: null, draft: null }),
    setDraft: (draft) => set(draft === null ? { draft } : { draft, selection: null }),
    setDragging: (dragging) =>
      set((state) => {
        const before = state.dragging;
        const isSame = before !== null && dragging !== null && before.index === dragging.index && before.by === dragging.by && sameObstacle(before.obstacle, dragging.obstacle);
        return isSame || (before === null && dragging === null) ? state : { dragging };
      }),
    setToReview: (names) => set({ toReview: [...names] }),
    reviewed: (name) => set((state) => (state.toReview.includes(name) ? { toReview: state.toReview.filter((one) => one !== name) } : state)),
    setCamera: (camera) => set((state) => ({ camera, cameraRequest: state.cameraRequest + 1 })),
    turnNorthUp: () => set((state) => ({ northRequest: state.northRequest + 1 })),
    setSunTime(sunTime) {
      refuseWhatIsNoTime(sunTime);
      set({ sunTime });
    },
    setPlaying: (isPlaying) => set((state) => (state.isPlaying === isPlaying ? state : { isPlaying })),
    showOnTheRoof: (what, on) => set((state) => (state.onTheRoof[what] === on ? state : { onTheRoof: { ...state.onTheRoof, [what]: on } })),
  }));
}

export const lensOf = (state: ViewState) => state.lens;
export const cameraOf = (state: ViewState) => state.camera;
export const cameraRequestOf = (state: ViewState) => state.cameraRequest;
export const northRequestOf = (state: ViewState) => state.northRequest;
export const sunTimeOf = (state: ViewState) => state.sunTime;
export const isPlayingOf = (state: ViewState) => state.isPlaying;
export const onTheRoofOf = (state: ViewState) => state.onTheRoof;
/** Whether the stage draws the sun path: in the Sun lens alone, while its switch is on (decision 16). */
export const showsSunPathOf = (state: ViewState) => state.lens === "sun" && state.onTheRoof.sunPath;
export const selectionOf = (state: ViewState) => state.selection;
export const draftOf = (state: ViewState) => state.draft;
export const toReviewOf = (state: ViewState) => state.toReview;
export const draggingOf = (state: ViewState) => state.dragging;
