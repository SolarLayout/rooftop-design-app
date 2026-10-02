import type { ThreeEvent } from "@react-three/fiber";
import { isAPress } from "@/lib/scene/pick";

/** Whether the device has a pointer that can hover: the hover outline is for it alone (guidelines.md, "3D scene"). */
export const canHover = () => window.matchMedia("(hover: hover)").matches;

/**
 * A press on a thing of the scene: the event stops at it, so that what lies under it is not pressed too,
 * and nothing happens when the pointer was dragged there (an orbit of the camera that ends on the roof is
 * no press on the roof).
 */
export function onPress(event: ThreeEvent<MouseEvent>, then: () => void): void {
  event.stopPropagation();
  if (isAPress(event.delta)) then();
}

/**
 * A handler that takes what it is told at most once a frame: the last of what came between two frames, on the
 * frame (plan/phase-07-plan.md, step 15: the string under the pointer is read once a frame, not on every move).
 */
export function oncePerFrame<T>(take: (value: T) => void, schedule: (run: () => void) => void = (run) => void requestAnimationFrame(run)): (value: T) => void {
  let waiting = false;
  let last: T;
  return (value) => {
    last = value;
    if (waiting) return;
    waiting = true;
    schedule(() => {
      waiting = false;
      take(last);
    });
  };
}
