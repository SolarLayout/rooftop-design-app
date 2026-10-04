import { describe, expect, test } from "bun:test";
import { PerspectiveCamera } from "three";
import { bearingDegOf, cameraOf, canvasOf, createStageStore, cursorOf, groundOf, labelsOf, moduleWritesOf, sunLabelsOf } from "./stage-store";

// What the scene tells the DOM over it, written on each drawn frame: it must not wake React for nothing.

describe("the stage store", () => {
  test("it begins with no labels, looking north", () => {
    const state = createStageStore().getState();

    expect(labelsOf(state)).toEqual([]);
    expect(bearingDegOf(state)).toBe(0);
  });

  test("labels that are the same, to the pixel, leave the state as it is", () => {
    const store = createStageStore();
    const label = { kind: "label" as const, words: "90.0 m", x: 100.2, y: 50.4, visible: true };
    store.getState().setLabels([label]);
    const before = labelsOf(store.getState());

    store.getState().setLabels([{ ...label, x: 100.4 }]);

    expect(labelsOf(store.getState())).toBe(before);
  });

  test("labels that moved are taken", () => {
    const store = createStageStore();
    store.getState().setLabels([{ kind: "label", words: "90.0 m", x: 100, y: 50, visible: true }]);

    store.getState().setLabels([{ kind: "label", words: "90.0 m", x: 120, y: 50, visible: true }]);

    expect(labelsOf(store.getState())).toEqual([{ kind: "label", words: "90.0 m", x: 120, y: 50, visible: true }]);
  });

  test("a bearing that is the same to a tenth of a degree leaves the state as it is; one that turned is taken", () => {
    const store = createStageStore();
    store.getState().setBearing(45.94);
    const before = store.getState();

    store.getState().setBearing(45.91);
    expect(store.getState()).toBe(before);

    store.getState().setBearing(46.2);
    expect(bearingDegOf(store.getState())).toBe(46.2);
  });
});

describe("the ground", () => {
  test("is nothing until the scene says what it drew, and takes only a change", () => {
    const store = createStageStore();
    expect(groundOf(store.getState())).toBe("none");
    const before = store.getState();

    store.getState().setGround("none");
    expect(store.getState()).toBe(before);

    store.getState().setGround("imagery");
    expect(groundOf(store.getState())).toBe("imagery");
  });
});

// The cursor over the stage (plan step 17): each thing under the pointer says what it wants, by name; the
// strongest wins, so that a module over the roof and the roof under it never fight.
describe("the cursor", () => {
  test("is the default until something is under the pointer", () => {
    expect(cursorOf(createStageStore().getState())).toBe("default");
  });

  test("a thing under the pointer asks for a cursor; when it is left the cursor goes back", () => {
    const store = createStageStore();

    store.getState().setOver("roof", "pointer");
    expect(cursorOf(store.getState())).toBe("pointer");

    store.getState().setOver("roof", null);
    expect(cursorOf(store.getState())).toBe("default");
  });

  test("of several the strongest wins: grabbing over grab over pointer; one left leaves the others", () => {
    const store = createStageStore();
    store.getState().setOver("roof", "pointer");
    store.getState().setOver("obstacle-0", "grab");
    expect(cursorOf(store.getState())).toBe("grab");

    store.getState().setOver("drag", "grabbing");
    expect(cursorOf(store.getState())).toBe("grabbing");

    store.getState().setOver("drag", null);
    store.getState().setOver("obstacle-0", null);
    expect(cursorOf(store.getState())).toBe("pointer");
  });

  test("saying the same again leaves the state as it is", () => {
    const store = createStageStore();
    store.getState().setOver("roof", "pointer");
    const before = store.getState();

    store.getState().setOver("roof", "pointer");
    expect(store.getState()).toBe(before);

    store.getState().setOver("modules", null);
    expect(store.getState()).toBe(before);
  });
});

// The camera and the size of the canvas (plan step 19): a pointer on the DOM over the stage becomes a ray
// through them. The same camera at the same size leaves the state as it is.
describe("the camera", () => {
  test("is none until the first frame, then the one the Projector saw, with the canvas's size", () => {
    const store = createStageStore();
    expect(cameraOf(store.getState())).toBeNull();
    const camera = new PerspectiveCamera();

    store.getState().setCamera(camera, 800, 600);

    expect(cameraOf(store.getState())).toEqual({ camera, width: 800, height: 600 });
  });

  test("the same camera at the same size leaves the state as it is; another size is taken", () => {
    const store = createStageStore();
    const camera = new PerspectiveCamera();
    store.getState().setCamera(camera, 800, 600);
    const before = store.getState();

    store.getState().setCamera(camera, 800, 600);
    expect(store.getState()).toBe(before);

    store.getState().setCamera(camera, 1000, 600);
    expect(cameraOf(store.getState())?.width).toBe(1000);
  });

  test("the canvas the scene draws on is none until it is told, then the one told, and none again when it goes: the DOM over the stage sends the wheel on to it", () => {
    const store = createStageStore();
    expect(canvasOf(store.getState())).toBeNull();
    const canvas = {} as HTMLCanvasElement;

    store.getState().setCanvas(canvas);
    expect(canvasOf(store.getState())).toBe(canvas);
    const before = store.getState();
    store.getState().setCanvas(canvas);
    expect(store.getState()).toBe(before);

    store.getState().setCanvas(null);
    expect(canvasOf(store.getState())).toBeNull();
  });

  // The counter of development behind "scrubbing never rebuilds the modules" (plan/phase-06-plan.md, decision 6).
  test("counts the writes of the modules' matrices, from none", () => {
    const store = createStageStore();
    expect(moduleWritesOf(store.getState())).toBe(0);

    store.getState().countModuleWrite();
    store.getState().countModuleWrite();

    expect(moduleWritesOf(store.getState())).toBe(2);
  });
});

// The sun path's marks are projected apart from the labels of the scene, so that the hour moves them alone.
describe("the sun's labels", () => {
  test("are none at the start, kept apart from the labels, and taken only when they moved", () => {
    const store = createStageStore();
    expect(sunLabelsOf(store.getState())).toEqual([]);
    const marker = { kind: "sun" as const, words: "", x: 100, y: 50, visible: true };

    store.getState().setSunLabels([marker]);
    const before = store.getState();
    store.getState().setSunLabels([{ ...marker, x: 100.3 }]);

    expect(sunLabelsOf(store.getState())).toEqual([marker]);
    expect(store.getState()).toBe(before);
    expect(labelsOf(store.getState())).toEqual([]);
  });
});
