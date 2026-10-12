import { describe, expect, test } from "bun:test";
import type { DayHours } from "../flow/sun-day";
import { LOOP, momentOfScene, REDUCED_SCRIPT, sceneAfter, sceneBefore, SCENES, SCRIPT, stateAt } from "./tour";

// The tour's script (plan/phase-10-plan.md, step 16, decision 9): six scenes in order, 40 s in all, each setting
// the camera, the reveal, the hour, the colouring and the energy's count at a moment; under reduced motion the
// same scenes as cuts held for their time.

const PUNE_DEC: DayHours = { from: 6.75, to: 17.25, sky: "rises and sets" };

const NOTHING_REVEALED = { building: 0, obstacles: 0, modules: 0 };
const EVERYTHING_REVEALED = { building: 1, obstacles: 1, modules: 1 };

describe("the scenes", () => {
  test("six, in the order of decision 9, with their durations: 40 s in all", () => {
    expect(SCENES.map((scene) => [scene.id, scene.duration])).toEqual([
      ["satellite", 4000],
      ["rising", 4000],
      ["filling", 6000],
      ["day", 12000],
      ["strings", 4000],
      ["energy", 10000],
    ]);
    expect(LOOP).toBe(40_000);
  });

  test("each has its name, and a noun for the line at the foot (V2 · 13, V2-40)", () => {
    expect(SCENES.map((scene) => [scene.name, scene.words])).toEqual([
      ["The place", "The roof from above"],
      ["The roof", "The roof in 3D"],
      ["The array", "The array"],
      ["The sun", "Shadows over the day"],
      ["The strings", "The strings"],
      ["The energy", "Energy over the year"],
    ]);
  });
});

describe("the state at a moment", () => {
  test("at the start: the satellite from above, the camera tilting from the plan into 3D over the scene, nothing revealed, the hour held", () => {
    const state = stateAt(0, PUNE_DEC);

    expect(state.scene).toBe("satellite");
    expect(state.index).toBe(0);
    expect(state.into).toBe(0);
    expect(state.words).toBe("The roof from above");
    expect(state.camera).toEqual({ from: "plan", to: "3d", over: 4000 });
    expect(state.reveal).toEqual(NOTHING_REVEALED);
    expect(state.hour).toBeNull();
    expect(state.colouring).toBeNull();
    expect(state.figures).toBe(0);
    expect(state.loop).toBe(0);
  });

  test("the building rises over the first two seconds of its scene, then the obstacles over the next two", () => {
    expect(stateAt(4000, PUNE_DEC).scene).toBe("rising");
    expect(stateAt(4000, PUNE_DEC).camera).toEqual({ from: null, to: "3d", over: 0 });
    expect(stateAt(4000, PUNE_DEC).reveal).toEqual(NOTHING_REVEALED);
    expect(stateAt(5000, PUNE_DEC).reveal).toEqual({ building: 0.5, obstacles: 0, modules: 0 });
    expect(stateAt(6000, PUNE_DEC).reveal).toEqual({ building: 1, obstacles: 0, modules: 0 });
    expect(stateAt(7000, PUNE_DEC).reveal).toEqual({ building: 1, obstacles: 0.5, modules: 0 });
    expect(stateAt(7999, PUNE_DEC).reveal.obstacles).toBeCloseTo(1, 2);
  });

  test("the modules fill over their six seconds", () => {
    expect(stateAt(8000, PUNE_DEC).scene).toBe("filling");
    expect(stateAt(8000, PUNE_DEC).reveal).toEqual({ building: 1, obstacles: 1, modules: 0 });
    expect(stateAt(11000, PUNE_DEC).reveal.modules).toBe(0.5);
    expect(stateAt(13999, PUNE_DEC).reveal.modules).toBeCloseTo(1, 2);
    expect(stateAt(11000, PUNE_DEC).hour).toBeNull();
  });

  test("the day plays from sunrise to sunset over twelve seconds, everything revealed", () => {
    expect(stateAt(14000, PUNE_DEC).scene).toBe("day");
    expect(stateAt(14000, PUNE_DEC).reveal).toEqual(EVERYTHING_REVEALED);
    expect(stateAt(14000, PUNE_DEC).hour).toBe(6.75);
    expect(stateAt(20000, PUNE_DEC).hour).toBe(12);
    expect(stateAt(25999, PUNE_DEC).hour).toBeCloseTo(17.25, 1);
    expect(stateAt(20000, PUNE_DEC).colouring).toBeNull();
  });

  test("the day scene alone draws the sun path (D72); every state says how far into its scene it is", () => {
    const sunPaths = [0, 5000, 9000, 14000, 27000, 31000].map((t) => [stateAt(t, PUNE_DEC).scene, stateAt(t, PUNE_DEC).sunPath]);
    expect(sunPaths).toEqual([["satellite", false], ["rising", false], ["filling", false], ["day", true], ["strings", false], ["energy", false]]);
    expect(stateAt(0, PUNE_DEC).share).toBe(0);
    expect(stateAt(17000, PUNE_DEC).share).toBe(0.25);
  });

  test("without the day's hours the day scene holds the hour", () => {
    expect(stateAt(20000, null).hour).toBeNull();
  });

  test("the strings light up by MPPT, the hour held again", () => {
    const state = stateAt(26000, PUNE_DEC);

    expect(state.scene).toBe("strings");
    expect(state.colouring).toBe("mppt");
    expect(state.hour).toBeNull();
    expect(state.reveal).toEqual(EVERYTHING_REVEALED);
    expect(state.figures).toBe(0);
  });

  test("the energy counts over six seconds and is held for four, the strings still lit", () => {
    expect(stateAt(30000, PUNE_DEC).scene).toBe("energy");
    expect(stateAt(30000, PUNE_DEC).figures).toBe(0);
    expect(stateAt(33000, PUNE_DEC).figures).toBe(0.5);
    expect(stateAt(36000, PUNE_DEC).figures).toBe(1);
    expect(stateAt(39999, PUNE_DEC).figures).toBe(1);
    expect(stateAt(39999, PUNE_DEC).colouring).toBe("mppt");
  });

  test("the loop begins again at 40 s, and counts the loops that are over", () => {
    const again = stateAt(LOOP, PUNE_DEC);

    expect(again.scene).toBe("satellite");
    expect(again.into).toBe(0);
    expect(again.loop).toBe(1);
    expect(stateAt(LOOP * 2 + 5000, PUNE_DEC)).toEqual({ ...stateAt(5000, PUNE_DEC), loop: 2 });
  });

  test("a moment before the start is refused", () => {
    expect(() => stateAt(-1, PUNE_DEC)).toThrow(/-1/);
  });
});

describe("under reduced motion", () => {
  test("the same scenes, as long, in the same words", () => {
    expect(REDUCED_SCRIPT.map((scene) => [scene.id, scene.duration, scene.words])).toEqual(SCRIPT.map((scene) => [scene.id, scene.duration, scene.words]));
  });

  test("the satellite is a cut to the plan, held; 3D is a cut at the next scene", () => {
    expect(stateAt(0, PUNE_DEC, REDUCED_SCRIPT).camera).toEqual({ from: null, to: "plan", over: 0 });
    expect(stateAt(3999, PUNE_DEC, REDUCED_SCRIPT).camera).toEqual({ from: null, to: "plan", over: 0 });
    expect(stateAt(4000, PUNE_DEC, REDUCED_SCRIPT).camera).toEqual({ from: null, to: "3d", over: 0 });
  });

  test("the building and the obstacles stand whole at once; the modules too", () => {
    expect(stateAt(4000, PUNE_DEC, REDUCED_SCRIPT).reveal).toEqual({ building: 1, obstacles: 1, modules: 0 });
    expect(stateAt(8000, PUNE_DEC, REDUCED_SCRIPT).reveal).toEqual(EVERYTHING_REVEALED);
  });

  test("the day is a still: the hour held as the Studio has it, the sun's arc drawn (V2-103)", () => {
    expect([14000, 20000, 25999].map((t) => stateAt(t, PUNE_DEC, REDUCED_SCRIPT).hour)).toEqual([null, null, null]);
    expect(stateAt(20000, PUNE_DEC, REDUCED_SCRIPT).sunPath).toBe(true);
  });

  test("no scene moves the camera: each is a cut", () => {
    expect(REDUCED_SCRIPT.map((scene) => scene.camera.over)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  test("the energy stands at its number from the start of its scene", () => {
    expect(stateAt(30000, PUNE_DEC, REDUCED_SCRIPT).figures).toBe(1);
  });
});

describe("going between scenes (V2 · 13)", () => {
  test("the moment a scene begins, in the loop under way", () => {
    expect(momentOfScene(0, 0)).toBe(0);
    expect(momentOfScene(3, 5000)).toBe(14000);
    expect(momentOfScene(5, LOOP + 1000)).toBe(LOOP + 30000);
  });

  test("the scene after: the next from its beginning; after the last, the first of the next loop", () => {
    expect(sceneAfter(5000)).toBe(8000);
    expect(sceneAfter(14000)).toBe(26000);
    expect(sceneAfter(35000)).toBe(LOOP);
    expect(stateAt(sceneAfter(35000), PUNE_DEC).loop).toBe(1);
  });

  test("the scene before: the one before from its beginning; before the first, the last", () => {
    expect(sceneBefore(9000)).toBe(4000);
    expect(sceneBefore(4500)).toBe(0);
    expect(sceneBefore(LOOP + 1000)).toBe(30000);
    expect(sceneBefore(1000)).toBe(30000);
  });

  test("under reduced motion the scenes begin where they do in the script", () => {
    expect(sceneAfter(5000, REDUCED_SCRIPT)).toBe(8000);
  });
});
