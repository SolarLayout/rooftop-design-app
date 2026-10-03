// How the design is looked at: the lens, the camera, the time of the sun. A store without React.
// Nothing of it is a part of the design: it is not in the .rtd document.
import { createStore } from "zustand/vanilla";
import type { Lens } from "../routes";
import type { Colouring } from "../scene/string-colours";
import { sameObstacle, type Dragging } from "../scene/drag";
import type { DraftObstacle } from "../studio/obstacle-fields";

/** Where the camera stands (docs/design/guidelines.md, "3D scene"). */
export const CAMERA_PRESETS = ["3d", "plan", "fit", "sun-eye"] as const;
export type CameraPreset = (typeof CAMERA_PRESETS)[number];

/** How far each part of the design stands revealed, as a share from 0 to 1 (plan/phase-10-plan.md, step 17). */
export type Reveal = { building: number; obstacles: number; modules: number };

/**
 * What Present lays over the view while its tour runs (plan/phase-10-plan.md, decisions 8 and 9): the reveal of the
 * building, the obstacles and the modules, and what the strings are coloured by, whatever the lens. Null in the Studio,
 * which shows everything.
 */
export type Presentation = { reveal: Reveal; colouring: Colouring | null };

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

/** The tab of the Sun lens: its shadows, or the shade map of the modules (decision 16). */
export type SunTab = "shadows" | "shade-map";

/**
 * What is selected on the roof: the roof, an obstacle, a kept-clear area or a module, by its index in its list;
 * in the Strings lens a string of the chosen option, by its label (plan/phase-07-plan.md, decision 13).
 */
export type Selection = { kind: "roof" } | { kind: "obstacle" | "keepout" | "module"; index: number } | { kind: "string"; label: string };

export type ViewState = {
  /** The lens that was opened last. The Studio comes back to it. */
  lens: Lens;
  camera: CameraPreset;
  /** How many times a preset was asked for: the camera frames on each request, also of the same preset (Fit). */
  cameraRequest: number;
  /** The preset before the one asked for last: where a move begins. */
  cameraFrom: CameraPreset;
  /** Milliseconds the camera takes to the preset asked for last; 0 for a cut, as the Studio's presets are (decision 10). */
  cameraMove: number;
  /** How many times north up was asked for: the camera turns on each request. */
  northRequest: number;
  sunTime: SunTime;
  /** Whether the time plays (plan/phase-06-plan.md, decision 4): of the view, as the time is. */
  isPlaying: boolean;
  onTheRoof: OnTheRoof;
  /** The tab of the Sun lens; leaving the lens takes it back to the shadows. */
  sunTab: SunTab;
  selection: Selection | null;
  /** What the Strings lens colours the strings by (plan/phase-07-plan.md, decision 12): by MPPT at first, as the board. */
  stringColouring: Colouring;
  /** The string under the pointer, by its label, on a device that can hover (decision 13); null for none. */
  tracedString: string | null;
  /**
   * A new obstacle before its height is typed (decision 15): of the view until then, and the one thing
   * that is open while it stands. A selection drops it.
   */
  draft: DraftObstacle | null;
  /** The obstacles whose height a drawing could not give, by name, until each is typed (decision 13). */
  toReview: string[];
  /** An obstacle while the pointer drags it, as the pointer has it (decision 12); null while none is. */
  dragging: Dragging | null;
  /** Present's tour over the view; null in the Studio. */
  presentation: Presentation | null;
  showLens: (lens: Lens) => void;
  setToReview: (names: readonly string[]) => void;
  reviewed: (name: string) => void;
  select: (selection: Selection | null) => void;
  /** Clears what is selected and drops the draft. */
  clearSelection: () => void;
  setDraft: (draft: DraftObstacle | null) => void;
  /** The drag as it is now; the same obstacle told again changes nothing. Null when the drag is over. */
  setDragging: (dragging: Dragging | null) => void;
  /** The camera to a preset: at once, or over `over` milliseconds when Present asks (decision 10). */
  setCamera: (camera: CameraPreset, options?: { over: number }) => void;
  turnNorthUp: () => void;
  setSunTime: (sunTime: SunTime) => void;
  setPlaying: (isPlaying: boolean) => void;
  showOnTheRoof: (what: keyof OnTheRoof, on: boolean) => void;
  showSunTab: (tab: SunTab) => void;
  colourStringsBy: (colouring: Colouring) => void;
  /** The string under the pointer, or null when the pointer left the strings; the same told again changes nothing. */
  traceString: (label: string | null) => void;
  /** Present's tour over the view, or null when it ends; the same told again changes nothing. */
  setPresentation: (presentation: Presentation | null) => void;
};

export type ViewStore = ReturnType<typeof createViewStore>;

// As the approved mockups open: the first lens, in 3D, the design day at 10:30.
const AT_THE_START = { lens: "roof", camera: "3d", cameraRequest: 0, cameraFrom: "3d", cameraMove: 0, northRequest: 0, sunTime: { day: "design_day", hour: 10.5 }, isPlaying: false, onTheRoof: { sunPath: true, window: true, shadowOutlines: false }, sunTab: "shadows", selection: null, stringColouring: "mppt", tracedString: null, draft: null, toReview: [] as string[], dragging: null, presentation: null as Presentation | null } as const;

function refuseWhatIsNoTime({ day, hour }: SunTime): void {
  if (!(hour >= 0 && hour <= 24)) throw new RangeError(`${hour} is no hour of a day: from 0 to 24.`);
  if (day !== "design_day" && !(Number.isInteger(day) && day >= 1 && day <= 366)) {
    throw new RangeError(`${day} is no day of a year: from 1 to 366, or the design day.`);
  }
}

function samePresentation(a: Presentation | null, b: Presentation | null): boolean {
  if (a === null || b === null) return a === b;
  return a.colouring === b.colouring && a.reveal.building === b.reveal.building && a.reveal.obstacles === b.reveal.obstacles && a.reveal.modules === b.reveal.modules;
}

export function createViewStore() {
  return createStore<ViewState>()((set) => ({
    ...AT_THE_START,
    // Leaving a lens takes back its tab of the Sun lens, and the string traced and selected of the Strings lens:
    // the strings are drawn there alone.
    showLens: (lens) =>
      set((state) => (lens === state.lens ? state : { lens, sunTab: "shadows", tracedString: null, selection: state.selection?.kind === "string" ? null : state.selection })),
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
    setCamera: (camera, options) => set((state) => ({ camera, cameraRequest: state.cameraRequest + 1, cameraFrom: state.camera, cameraMove: options?.over ?? 0 })),
    turnNorthUp: () => set((state) => ({ northRequest: state.northRequest + 1 })),
    setSunTime(sunTime) {
      refuseWhatIsNoTime(sunTime);
      set({ sunTime });
    },
    setPlaying: (isPlaying) => set((state) => (state.isPlaying === isPlaying ? state : { isPlaying })),
    colourStringsBy: (stringColouring) => set((state) => (state.stringColouring === stringColouring ? state : { stringColouring })),
    traceString: (tracedString) => set((state) => (state.tracedString === tracedString ? state : { tracedString })),
    showSunTab: (sunTab) => set((state) => (state.sunTab === sunTab ? state : { sunTab })),
    showOnTheRoof: (what, on) => set((state) => (state.onTheRoof[what] === on ? state : { onTheRoof: { ...state.onTheRoof, [what]: on } })),
    setPresentation: (presentation) => set((state) => (samePresentation(state.presentation, presentation) ? state : { presentation })),
  }));
}

export const lensOf = (state: ViewState) => state.lens;
export const cameraOf = (state: ViewState) => state.camera;
export const cameraRequestOf = (state: ViewState) => state.cameraRequest;
export const cameraFromOf = (state: ViewState) => state.cameraFrom;
export const cameraMoveOf = (state: ViewState) => state.cameraMove;
export const presentationOf = (state: ViewState) => state.presentation;
export const northRequestOf = (state: ViewState) => state.northRequest;
export const sunTimeOf = (state: ViewState) => state.sunTime;
export const isPlayingOf = (state: ViewState) => state.isPlaying;
export const onTheRoofOf = (state: ViewState) => state.onTheRoof;
export const sunTabOf = (state: ViewState) => state.sunTab;
/** Whether the modules are coloured by their shade: in the Sun lens alone, while its Shade map tab is taken; never under a presentation. */
export const isShadeMapShownOf = (state: ViewState) => state.presentation === null && state.lens === "sun" && state.sunTab === "shade-map";
/** Whether the stage draws the sun path: in the Sun lens alone, while its switch is on (decision 16); never under a presentation. */
export const showsSunPathOf = (state: ViewState) => state.presentation === null && state.lens === "sun" && state.onTheRoof.sunPath;
export const selectionOf = (state: ViewState) => state.selection;
export const stringColouringOf = (state: ViewState) => state.stringColouring;
export const tracedStringOf = (state: ViewState) => state.tracedString;
/** What the strings on the roof are coloured by: what the presentation says while one runs; else in the Strings lens alone, null in every other lens. */
export const stringsShownByOf = (state: ViewState): Colouring | null => (state.presentation ? state.presentation.colouring : state.lens === "strings" ? state.stringColouring : null);

const NONE_LIT: readonly string[] = [];

/** The labels of the strings drawn white: the one selected and the one traced, once each; none outside the Strings lens, none under a presentation. */
export function litStringsOf(state: ViewState): readonly string[] {
  if (state.lens !== "strings" || state.presentation !== null) return NONE_LIT;
  const selected = state.selection?.kind === "string" ? state.selection.label : null;
  const traced = state.tracedString;
  if (selected === null) return traced === null ? NONE_LIT : [traced];
  return traced === null || traced === selected ? [selected] : [selected, traced];
}
export const draftOf = (state: ViewState) => state.draft;
export const toReviewOf = (state: ViewState) => state.toReview;
export const draggingOf = (state: ViewState) => state.dragging;
