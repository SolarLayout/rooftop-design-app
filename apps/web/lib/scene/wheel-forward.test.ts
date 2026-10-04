import { describe, expect, test } from "bun:test";
import { wheelInitOf } from "./wheel-forward";

// A mouse wheel over a DOM handle of the selected obstacle reaches the canvas (plan/phase-11-plan.md, step 33): the
// handle takes the pointer, so the wheel is sent on to the canvas as a wheel event of its own, with what the camera
// reads of it.

describe("the wheel sent on to the canvas", () => {
  test("carries where the pointer is, how far the wheel turned and in what unit, and the keys held", () => {
    const init = wheelInitOf({ deltaX: 1, deltaY: -53, deltaZ: 0, deltaMode: 0, clientX: 420, clientY: 318, ctrlKey: true, metaKey: false, shiftKey: false, altKey: true });

    expect(init).toEqual({ deltaX: 1, deltaY: -53, deltaZ: 0, deltaMode: 0, clientX: 420, clientY: 318, ctrlKey: true, metaKey: false, shiftKey: false, altKey: true, bubbles: true, cancelable: true });
  });

  test("bubbles and can be cancelled, as the browser's own is: the camera takes it and stops the page from scrolling", () => {
    const init = wheelInitOf({ deltaX: 0, deltaY: 100, deltaZ: 0, deltaMode: 1, clientX: 0, clientY: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false });

    expect(init.bubbles).toBe(true);
    expect(init.cancelable).toBe(true);
    expect(init.deltaMode).toBe(1);
  });
});
