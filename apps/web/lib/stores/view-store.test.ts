import { describe, expect, test } from "bun:test";
import type { Obstacle } from "../api";
import type { DraftObstacle } from "../geometry/obstacle-fields";
import { cameraFromOf, cameraMoveOf, cameraOf, cameraRequestOf, createViewStore, framesTheDomeOf, groundDrawnOf, groundOf, presentationOf, draftOf, draggingOf, isPlayingOf, isShadeMapShownOf, lensOf, litStringsOf, onTheRoofOf, sunTabOf, northRequestOf, selectionOf, showsSunPathOf, stringColouringOf, stringsShownByOf, sunTimeOf, toReviewOf, tracedStringOf } from "./view-store";

describe("the view", () => {
  test("it begins on the first step, in 3D, at the design day's noon", () => {
    const state = createViewStore().getState();

    expect(lensOf(state)).toBe("roof");
    expect(cameraOf(state)).toBe("3d");
    expect(sunTimeOf(state)).toEqual({ day: "design_day", hour: 12 });
    expect(isPlayingOf(state)).toBe(false);
    expect(onTheRoofOf(state)).toEqual({ sunPath: true, window: true, shadowOutlines: false });
  });

  // What the Sun lens draws on the roof (plan/phase-06-plan.md, decision 16): of the view, as the board has it at first.
  test("each switch of On the roof is kept apart; told again, nothing changes", () => {
    const store = createViewStore();

    store.getState().showOnTheRoof("shadowOutlines", true);
    store.getState().showOnTheRoof("sunPath", false);
    const before = store.getState();
    store.getState().showOnTheRoof("sunPath", false);

    expect(onTheRoofOf(store.getState())).toEqual({ sunPath: false, window: true, shadowOutlines: true });
    expect(store.getState()).toBe(before);
  });

  test("the sun path is drawn in the Sun view alone, while its switch is on", () => {
    const store = createViewStore();
    expect(showsSunPathOf(store.getState())).toBe(false);

    store.getState().showSunView(true);
    expect(showsSunPathOf(store.getState())).toBe(true);

    store.getState().showOnTheRoof("sunPath", false);
    expect(showsSunPathOf(store.getState())).toBe(false);
  });

  test("the camera frames the sun path's dome in the Sun view with the path on, and through the whole of Present, every scene (D72)", () => {
    const store = createViewStore();
    expect(framesTheDomeOf(store.getState())).toBe(false);
    store.getState().showSunView(true);
    expect(framesTheDomeOf(store.getState())).toBe(true);
    store.getState().showOnTheRoof("sunPath", false);
    expect(framesTheDomeOf(store.getState())).toBe(false);

    store.getState().setPresentation({ reveal: { building: 0, obstacles: 0, modules: 0 }, colouring: null, sunPath: false });
    expect(framesTheDomeOf(store.getState())).toBe(true);
  });

  test("under Present the presentation says whether the sun path is drawn, whatever the view and its switch (D72)", () => {
    const store = createViewStore();
    store.getState().setPresentation({ reveal: { building: 1, obstacles: 1, modules: 1 }, colouring: null, sunPath: true });
    expect(showsSunPathOf(store.getState())).toBe(true);

    store.getState().setPresentation({ reveal: { building: 1, obstacles: 1, modules: 1 }, colouring: null, sunPath: false });
    store.getState().showSunView(true);
    expect(showsSunPathOf(store.getState())).toBe(false);
  });

  // The tab of the Sun view (plan/phase-06-plan.md, decisions 12 and 16): of the view; the shade map is shown
  // in the Sun view alone, and leaving the view leaves it off.
  test("the shade map is shown in the Sun view while its tab is taken, and the view left takes it off", () => {
    const store = createViewStore();
    store.getState().showSunView(true);
    expect(sunTabOf(store.getState())).toBe("shadows");
    expect(isShadeMapShownOf(store.getState())).toBe(false);

    store.getState().showSunTab("shade-map");
    expect(isShadeMapShownOf(store.getState())).toBe(true);

    store.getState().showSunView(false);
    expect(isShadeMapShownOf(store.getState())).toBe(false);
    expect(sunTabOf(store.getState())).toBe("shadows");
  });

  // The time belongs to the Sun view (V2 · 3, D97): the other steps draw the design day's noon, still.
  test("the Sun view left takes the time back to the design day's noon", () => {
    const store = createViewStore();
    store.getState().showSunView(true);
    store.getState().setSunTime({ day: 172, hour: 16.5 });

    store.getState().showSunView(false);

    expect(sunTimeOf(store.getState())).toEqual({ day: "design_day", hour: 12 });
  });

  test("whether the time plays is kept; told again, nothing changes", () => {
    const store = createViewStore();
    store.getState().setPlaying(true);
    const before = store.getState();

    store.getState().setPlaying(true);

    expect(isPlayingOf(store.getState())).toBe(true);
    expect(store.getState()).toBe(before);
  });

  test("the lens that was opened is kept", () => {
    const store = createViewStore();

    store.getState().showLens("strings");

    expect(lensOf(store.getState())).toBe("strings");
  });

  test("the camera goes to a preset, and each request counts, so that Fit frames again", () => {
    const store = createViewStore();
    const before = cameraRequestOf(store.getState());

    store.getState().setCamera("plan");
    store.getState().setCamera("plan");

    expect(cameraOf(store.getState())).toBe("plan");
    expect(cameraRequestOf(store.getState())).toBe(before + 2);
  });

  test("the north control asks the camera to turn north up, and each request counts, so that it turns again", () => {
    const store = createViewStore();
    const before = northRequestOf(store.getState());

    store.getState().turnNorthUp();
    store.getState().turnNorthUp();

    expect(northRequestOf(store.getState())).toBe(before + 2);
    expect(cameraOf(store.getState())).toBe("3d");
  });

  test("the time of the sun is a day and an hour in solar time", () => {
    const store = createViewStore();

    store.getState().setSunTime({ day: 172, hour: 16 });

    expect(sunTimeOf(store.getState())).toEqual({ day: 172, hour: 16 });
  });

  test.each([
    [{ day: 172, hour: 24.5 }, "24.5 is no hour of a day: from 0 to 24."],
    [{ day: 172, hour: -1 }, "-1 is no hour of a day: from 0 to 24."],
    [{ day: 172, hour: Number.NaN }, "NaN is no hour of a day: from 0 to 24."],
    [{ day: 0, hour: 12 }, "0 is no day of a year: from 1 to 366, or the design day."],
    [{ day: 367, hour: 12 }, "367 is no day of a year: from 1 to 366, or the design day."],
    [{ day: 1.5, hour: 12 }, "1.5 is no day of a year: from 1 to 366, or the design day."],
  ] as const)("a time that is none is refused: %o", (sunTime, why) => {
    const store = createViewStore();

    expect(() => store.getState().setSunTime(sunTime)).toThrow(why);
    expect(sunTimeOf(store.getState())).toEqual({ day: "design_day", hour: 12 });
  });

  test("a change of one leaves the others", () => {
    const store = createViewStore();
    store.getState().showSunView(true);
    store.getState().setSunTime({ day: "design_day", hour: 9 });

    store.getState().setCamera("sun-eye");

    expect(store.getState().isSunView).toBe(true);
    expect(sunTimeOf(store.getState())).toEqual({ day: "design_day", hour: 9 });
  });
});

// What is selected on the roof (plan/phase-05-plan.md, decision 10): the list and the scene read the same.
describe("the selection", () => {
  test("nothing is selected at the start", () => {
    expect(selectionOf(createViewStore().getState())).toBeNull();
  });

  test("an obstacle, a kept-clear area or a module is selected by its index; the roof by itself", () => {
    const store = createViewStore();

    store.getState().select({ kind: "obstacle", index: 2 });
    expect(selectionOf(store.getState())).toEqual({ kind: "obstacle", index: 2 });

    store.getState().select({ kind: "keepout", index: 0 });
    expect(selectionOf(store.getState())).toEqual({ kind: "keepout", index: 0 });

    store.getState().select({ kind: "roof" });
    expect(selectionOf(store.getState())).toEqual({ kind: "roof" });
  });

  test("selecting what is selected leaves it selected; select null clears", () => {
    const store = createViewStore();
    store.getState().select({ kind: "module", index: 5 });

    store.getState().select({ kind: "module", index: 5 });
    expect(selectionOf(store.getState())).toEqual({ kind: "module", index: 5 });

    store.getState().select(null);
    expect(selectionOf(store.getState())).toBeNull();
  });

  test("another design opened clears the selection", () => {
    const store = createViewStore();
    store.getState().select({ kind: "obstacle", index: 0 });

    store.getState().clearSelection();

    expect(selectionOf(store.getState())).toBeNull();
  });
});

// The heights a drawing could not give (plan/phase-05-plan.md, decision 13): the names of the obstacles that
// got 1.0 m, reviewed one by one in the Roof lens.
describe("the heights to review", () => {
  test("none at the start; the import sets them; a typed height takes one off", () => {
    const store = createViewStore();
    expect(toReviewOf(store.getState())).toEqual([]);

    store.getState().setToReview(["Lift shaft", "Plant room", "Skylight"]);
    store.getState().reviewed("Plant room");

    expect(toReviewOf(store.getState())).toEqual(["Lift shaft", "Skylight"]);
  });

  test("a name that is not on the list changes nothing", () => {
    const store = createViewStore();
    store.getState().setToReview(["Lift shaft"]);
    const before = store.getState();

    store.getState().reviewed("Vent");

    expect(store.getState()).toBe(before);
  });
});

// A new obstacle before its height is typed (plan/phase-05-plan.md, decision 15): a draft of the view, not
// of the document, until the height comes; selected while it stands.
describe("the draft obstacle", () => {
  const draft: DraftObstacle = { name: "Box 7", kind: "box", x: 45, y: 20, length: 2, width: 2, rotation_deg: 0, diameter: 2, height: null, thickness: 0.2, trunk_height: 2, points: [], auto: false };

  test("none at the start; Add makes one and it takes the selection", () => {
    const store = createViewStore();
    expect(draftOf(store.getState())).toBeNull();
    store.getState().select({ kind: "obstacle", index: 2 });

    store.getState().setDraft(draft);

    expect(draftOf(store.getState())).toEqual(draft);
    expect(selectionOf(store.getState())).toBeNull();
  });

  test("a selection made while the draft stands drops the draft: one thing is open at a time", () => {
    const store = createViewStore();
    store.getState().setDraft(draft);

    store.getState().select({ kind: "obstacle", index: 0 });

    expect(draftOf(store.getState())).toBeNull();
    expect(selectionOf(store.getState())).toEqual({ kind: "obstacle", index: 0 });
  });

  test("the draft is edited in place; null drops it; clearing the selection drops it too", () => {
    const store = createViewStore();
    store.getState().setDraft(draft);

    store.getState().setDraft({ ...draft, length: 3 });
    expect(draftOf(store.getState())?.length).toBe(3);

    store.getState().clearSelection();
    expect(draftOf(store.getState())).toBeNull();

    store.getState().setDraft(draft);
    store.getState().setDraft(null);
    expect(draftOf(store.getState())).toBeNull();
  });
});

// An obstacle while it is dragged (plan step 19, decision 12): of the view until the drop commits it; the scene
// draws it where the pointer has it, the list says its live values.
describe("the drag", () => {
  const stairRoom: Obstacle = { name: "Stair room", kind: "box", x: 22.5, y: 18, length: 5, width: 4, rotation_deg: 0, diameter: 1, height: 3, thickness: 0.2, trunk_height: 2, points: [], auto: false };

  test("nothing is dragged at the start; a drag is the obstacle as the pointer has it; null ends it", () => {
    const store = createViewStore();
    expect(draggingOf(store.getState())).toBeNull();

    store.getState().setDragging({ index: 0, by: "move", obstacle: { ...stairRoom, x: 27.5 } });
    expect(draggingOf(store.getState())).toEqual({ index: 0, by: "move", obstacle: { ...stairRoom, x: 27.5 } });

    store.getState().setDragging(null);
    expect(draggingOf(store.getState())).toBeNull();
  });

  test("the same obstacle at the same place, told again, leaves the state as it is: the pointer moves more often than the snap", () => {
    const store = createViewStore();
    store.getState().setDragging({ index: 0, by: "move", obstacle: { ...stairRoom, x: 27.5 } });
    const before = store.getState();

    store.getState().setDragging({ index: 0, by: "move", obstacle: { ...stairRoom, x: 27.5 } });

    expect(store.getState()).toBe(before);
  });
});

// The strings on the roof (plan/phase-07-plan.md, decisions 12 and 13): coloured in the Strings lens alone, by
// MPPT at first as the board; a string traced under the pointer and a string selected, of the view.
describe("the strings on the roof", () => {
  test("are coloured by MPPT at first, in the Strings lens alone", () => {
    const store = createViewStore();

    expect(stringColouringOf(store.getState())).toBe("mppt");
    expect(stringsShownByOf(store.getState())).toBeNull();
    store.getState().showLens("strings");
    expect(stringsShownByOf(store.getState())).toBe("mppt");
  });

  test("the colour switch colours them by string, MPPT or inverter; told again, nothing changes", () => {
    const store = createViewStore();
    store.getState().showLens("strings");

    store.getState().colourStringsBy("string");
    expect(stringsShownByOf(store.getState())).toBe("string");
    const before = store.getState();
    store.getState().colourStringsBy("string");
    expect(store.getState()).toBe(before);
    store.getState().colourStringsBy("inverter");
    expect(stringsShownByOf(store.getState())).toBe("inverter");
  });

  test("leaving the Strings lens takes the colours off, the string traced and the string selected; the colouring is kept for the way back", () => {
    const store = createViewStore();
    store.getState().showLens("strings");
    store.getState().colourStringsBy("string");
    store.getState().traceString("S12");
    store.getState().select({ kind: "string", label: "S3" });

    store.getState().showLens("array");

    expect(stringsShownByOf(store.getState())).toBeNull();
    expect(tracedStringOf(store.getState())).toBeNull();
    expect(selectionOf(store.getState())).toBeNull();
    store.getState().showLens("strings");
    expect(stringsShownByOf(store.getState())).toBe("string");
  });

  test("leaving another lens keeps what it selected", () => {
    const store = createViewStore();
    store.getState().select({ kind: "obstacle", index: 2 });
    store.getState().showLens("array");
    expect(selectionOf(store.getState())).toEqual({ kind: "obstacle", index: 2 });
  });

  test("a string is traced by its label and the trace is let go; the same told again changes nothing", () => {
    const store = createViewStore();
    store.getState().showLens("strings");

    store.getState().traceString("S12");
    expect(tracedStringOf(store.getState())).toBe("S12");
    const before = store.getState();
    store.getState().traceString("S12");
    expect(store.getState()).toBe(before);
    store.getState().traceString(null);
    expect(tracedStringOf(store.getState())).toBeNull();
  });

  test("the strings lit are the one selected and the one traced, once each", () => {
    const store = createViewStore();
    store.getState().showLens("strings");
    expect(litStringsOf(store.getState())).toEqual([]);

    store.getState().select({ kind: "string", label: "S12" });
    expect(litStringsOf(store.getState())).toEqual(["S12"]);
    store.getState().traceString("S3");
    expect(litStringsOf(store.getState())).toEqual(["S12", "S3"]);
    store.getState().traceString("S12");
    expect(litStringsOf(store.getState())).toEqual(["S12"]);
    store.getState().clearSelection();
    expect(litStringsOf(store.getState())).toEqual(["S12"]);
  });

  // Present's camera (plan/phase-10-plan.md, step 17, decision 10): a preset asked for with a time moves there; the Studio's presets are instant.
  test("a preset asked for with a time to take moves there from the preset before; one asked for plainly is a cut", () => {
    const store = createViewStore();
    expect(cameraMoveOf(store.getState())).toBe(0);

    store.getState().setCamera("plan");
    store.getState().setCamera("3d", { over: 4000 });

    expect(cameraOf(store.getState())).toBe("3d");
    expect(cameraFromOf(store.getState())).toBe("plan");
    expect(cameraMoveOf(store.getState())).toBe(4000);

    store.getState().setCamera("fit");
    expect(cameraFromOf(store.getState())).toBe("3d");
    expect(cameraMoveOf(store.getState())).toBe(0);
  });
});

// The presentation (plan/phase-10-plan.md, step 17): Present's reveal and colouring, over the view while the tour runs; null in the Studio.
describe("the presentation", () => {
  const PRESENTING = { reveal: { building: 1, obstacles: 0.5, modules: 0 }, colouring: null, sunPath: false } as const;

  test("there is none at the start; one set is read back; the same set again changes nothing", () => {
    const store = createViewStore();
    expect(presentationOf(store.getState())).toBeNull();

    store.getState().setPresentation(PRESENTING);
    expect(presentationOf(store.getState())).toEqual(PRESENTING);
    const before = store.getState();
    store.getState().setPresentation({ reveal: { building: 1, obstacles: 0.5, modules: 0 }, colouring: null, sunPath: false });
    expect(store.getState()).toBe(before);
    store.getState().setPresentation({ ...PRESENTING, sunPath: true });
    expect(store.getState()).not.toBe(before);
    store.getState().setPresentation(PRESENTING);

    store.getState().setPresentation(null);
    expect(presentationOf(store.getState())).toBeNull();
  });

  test("the strings are coloured by what the presentation says, whatever the lens; by nothing when it says none", () => {
    const store = createViewStore();
    store.getState().setPresentation({ ...PRESENTING, colouring: "mppt" });
    expect(stringsShownByOf(store.getState())).toBe("mppt");

    store.getState().showLens("strings");
    store.getState().colourStringsBy("inverter");
    expect(stringsShownByOf(store.getState())).toBe("mppt");

    store.getState().setPresentation(PRESENTING);
    expect(stringsShownByOf(store.getState())).toBeNull();

    store.getState().setPresentation(null);
    expect(stringsShownByOf(store.getState())).toBe("inverter");
  });

  test("under a presentation no string is lit, the shade map and the sun path are not drawn, whatever the view holds", () => {
    const store = createViewStore();
    store.getState().showLens("strings");
    store.getState().select({ kind: "string", label: "S12" });
    store.getState().setPresentation({ ...PRESENTING, colouring: "mppt" });
    expect(litStringsOf(store.getState())).toEqual([]);

    store.getState().showSunView(true);
    store.getState().showSunTab("shade-map");
    expect(isShadeMapShownOf(store.getState())).toBe(false);
    expect(showsSunPathOf(store.getState())).toBe(false);

    store.getState().setPresentation(null);
    expect(isShadeMapShownOf(store.getState())).toBe(true);
    expect(showsSunPathOf(store.getState())).toBe(true);
  });

  // The ground under the roof (plan/phase-11-plan.md, step 35; decisions D57 and D70): the plain grid at first, or the
  // imagery once the Layers panel asks for it; of the view, not of the design.
  test("the ground is the plain grid at first; set, it is kept; told again, nothing changes", () => {
    const store = createViewStore();
    expect(groundOf(store.getState())).toBe("plain");

    store.getState().setGround("imagery");
    expect(groundOf(store.getState())).toBe("imagery");

    const before = store.getState();
    store.getState().setGround("imagery");
    expect(store.getState()).toBe(before);

    store.getState().setGround("plain");
    expect(groundOf(store.getState())).toBe("plain");
  });

  test("the ground drawn is the imagery only while the view asks for it and there is imagery to draw", () => {
    expect(groundDrawnOf("imagery", true)).toBe("imagery");
    expect(groundDrawnOf("plain", true)).toBe("plain");
    // Without a key or a location there is no imagery: the plain grid, whatever the switch says (D57).
    expect(groundDrawnOf("imagery", false)).toBe("plain");
    expect(groundDrawnOf("plain", false)).toBe("plain");
  });
});

// V2 (D95, D99): Sun is a view of the stage on every step, no lens; the work column can be hidden on desktop.
describe("the Sun view and the panel (V2)", () => {
  test("the Sun view is off at first and turns on over any step; the lens stays", () => {
    const view = createViewStore();
    view.getState().showLens("array");
    expect(view.getState().isSunView).toBe(false);
    view.getState().showSunView(true);
    expect(view.getState().isSunView).toBe(true);
    expect(view.getState().lens).toBe("array");
  });

  test("the shade map, the sun path and the dome follow the Sun view, not the lens", () => {
    const view = createViewStore();
    view.getState().showLens("strings");
    view.getState().showSunTab("shade-map");
    expect(isShadeMapShownOf(view.getState())).toBe(false);
    expect(showsSunPathOf(view.getState())).toBe(false);
    view.getState().showSunView(true);
    expect(isShadeMapShownOf(view.getState())).toBe(true);
    expect(showsSunPathOf(view.getState())).toBe(true);
    expect(framesTheDomeOf(view.getState())).toBe(true);
  });

  test("leaving the Sun view takes its tab back to the shadows", () => {
    const view = createViewStore();
    view.getState().showSunView(true);
    view.getState().showSunTab("shade-map");
    view.getState().showSunView(false);
    expect(view.getState().sunTab).toBe("shadows");
  });

  test("the panel hides and shows; an object selected on the roof shows it again", () => {
    const view = createViewStore();
    expect(view.getState().isPanelHidden).toBe(false);
    view.getState().hidePanel(true);
    expect(view.getState().isPanelHidden).toBe(true);
    view.getState().select({ kind: "obstacle", index: 0 });
    expect(view.getState().isPanelHidden).toBe(false);
  });
});

// The Strings step opens in Plan, where the strings read best (V2 · 6, D102); 3D stays one press away.
describe("the camera of the Strings step", () => {
  test("entering the step from the 3D view turns the camera to the plan, as a request of its own", () => {
    const store = createViewStore();
    const requests = store.getState().cameraRequest;

    store.getState().showLens("strings");

    expect(cameraOf(store.getState())).toBe("plan");
    expect(store.getState().cameraRequest).toBe(requests + 1);
  });

  test("leaving it returns the camera to 3D when the step had put it in the plan; the user's own choice stays", () => {
    const store = createViewStore();
    store.getState().showLens("strings");
    store.getState().showLens("array");
    expect(cameraOf(store.getState())).toBe("3d");

    store.getState().showLens("strings");
    store.getState().setCamera("fit");
    store.getState().showLens("roof");
    expect(cameraOf(store.getState())).toBe("fit");
  });

  test("a camera already in the plan or the fit is left where it is on entering", () => {
    const store = createViewStore();
    store.getState().setCamera("fit");
    store.getState().showLens("strings");

    expect(cameraOf(store.getState())).toBe("fit");
  });
});
