// A mouse wheel over a DOM handle of the selected obstacle reaches the canvas (plan/phase-11-plan.md, step 33):
// the handle takes the pointer, so the canvas never hears the wheel and the view does not zoom under it. The
// handles send the wheel on as a wheel event of their own on the canvas, which the camera's controls take as
// the browser's. Pure: what of the event is carried over.

/** What the camera reads of a wheel: where the pointer is, how far the wheel turned and in what unit, the keys held. */
export type WheelRead = Pick<WheelEvent, "deltaX" | "deltaY" | "deltaZ" | "deltaMode" | "clientX" | "clientY" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">;

/** The event to send on: the same wheel, bubbling and cancellable as the browser's, so that the controls take it and stop the page from scrolling. */
export function wheelInitOf({ deltaX, deltaY, deltaZ, deltaMode, clientX, clientY, ctrlKey, metaKey, shiftKey, altKey }: WheelRead): WheelEventInit {
  return { deltaX, deltaY, deltaZ, deltaMode, clientX, clientY, ctrlKey, metaKey, shiftKey, altKey, bubbles: true, cancelable: true };
}
