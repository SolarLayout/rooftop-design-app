import { describe, expect, test } from "bun:test";
import { clockOfTheTest } from "../clock-of-the-test";
import { createControls, isKeysLineShown, keyOf, SHOWN_FOR, trackOf } from "./controls";
import { SCENES } from "./tour";

// The presenter's controls of Present (V2 · 13, D110; V2-102): shown on a move of the pointer or a touch, hidden after
// 3 s while the tour plays, always while it is paused; the keys and what each does, other keys nothing.

const press = (key: string, modifiers: Partial<{ altKey: boolean; ctrlKey: boolean; metaKey: boolean }> = {}) => keyOf({ key, altKey: false, ctrlKey: false, metaKey: false, ...modifiers });

describe("the keys", () => {
  test("Space pauses and plays, ← and → move between scenes, Esc leaves", () => {
    expect([" ", "ArrowLeft", "ArrowRight", "Escape"].map((key) => press(key))).toEqual(["play-or-pause", "before", "after", "leave"]);
  });

  test("any other key does nothing, so a stray key never ends the tour; nor a key held with a modifier, the browser's own", () => {
    expect(["a", "Enter", "Tab", "ArrowUp", "Shift", "F11"].map((key) => press(key))).toEqual([null, null, null, null, null, null]);
    expect([press("ArrowLeft", { metaKey: true }), press(" ", { ctrlKey: true }), press("Escape", { altKey: true })]).toEqual([null, null, null]);
  });
});

describe("shown and hidden", () => {
  function controlled() {
    const time = clockOfTheTest();
    const controls = createControls({ clock: time.clock });
    return { controls, pass: time.pass, waiting: time.waiting, isShown: () => controls.view.getState().isShown };
  }

  test("hidden until a move of the pointer or a touch; shown then, and hidden 3 s after while the tour plays", () => {
    const { controls, pass, isShown } = controlled();
    expect(isShown()).toBe(false);

    controls.moved();
    expect(isShown()).toBe(true);
    pass(SHOWN_FOR - 1);
    expect(isShown()).toBe(true);
    pass(1);
    expect(isShown()).toBe(false);
    expect(SHOWN_FOR).toBe(3000);
  });

  test("each move keeps them 3 s more", () => {
    const { controls, pass, isShown, waiting } = controlled();
    controls.moved();
    pass(2000);
    controls.moved();
    pass(2000);

    expect(isShown()).toBe(true);
    expect(waiting()).toBe(1);
    pass(1000);
    expect(isShown()).toBe(false);
  });

  test("paused, they stay shown; played again, they hide 3 s later", () => {
    const { controls, pass, isShown, waiting } = controlled();
    controls.setPaused(true);
    expect(isShown()).toBe(true);
    pass(10_000);
    controls.moved();
    pass(10_000);
    expect(isShown()).toBe(true);
    expect(waiting()).toBe(0);

    controls.setPaused(false);
    pass(SHOWN_FOR);
    expect(isShown()).toBe(false);
  });

  test("held by a focus in the bar, as by a pause: shown while it is there, hidden 3 s after it leaves", () => {
    const { controls, pass, isShown } = controlled();
    controls.setFocused(true);
    pass(10_000);
    expect(isShown()).toBe(true);

    controls.setFocused(false);
    pass(SHOWN_FOR);
    expect(isShown()).toBe(false);
  });

  test("Tab is no key of the tour: it moves the focus, as the browser has it", () => {
    expect(press("Tab")).toBeNull();
  });

  test("stopped, nothing waits", () => {
    const { controls, waiting } = controlled();
    controls.moved();

    controls.stop();

    expect(waiting()).toBe(0);
  });
});

describe("the track of the six scenes", () => {
  test("the done ones full, the current filling, the rest empty; each named, short under its segment", () => {
    expect(trackOf(SCENES, 3, 0.45)).toEqual([
      { name: "The place", short: "Place", fill: 1, isCurrent: false },
      { name: "The roof", short: "Roof", fill: 1, isCurrent: false },
      { name: "The array", short: "Array", fill: 1, isCurrent: false },
      { name: "The sun", short: "Sun", fill: 0.45, isCurrent: true },
      { name: "The strings", short: "Strings", fill: 0, isCurrent: false },
      { name: "The energy", short: "Energy", fill: 0, isCurrent: false },
    ]);
  });
});

describe("the keys' line at the foot's right", () => {
  test("on the first loop while the controls are hidden; then it is gone", () => {
    expect(isKeysLineShown({ loop: 0, areControlsShown: false })).toBe(true);
    expect(isKeysLineShown({ loop: 0, areControlsShown: true })).toBe(false);
    expect(isKeysLineShown({ loop: 1, areControlsShown: false })).toBe(false);
  });
});
