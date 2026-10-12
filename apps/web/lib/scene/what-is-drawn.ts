// What the stage draws, by view and step: the Sun view shows the sun and the shadows, without the kept-clear areas of the
// layout. The roof's dimensions are the Roof step's (V2 · 7, audit V2-70): there alone, and in the Sun view only in the
// plan, the view things are measured in.
import type { Lens } from "../routes";
import type { CameraPreset } from "../stores/view-store";

export type Drawn = { keptClear: boolean; edgeLabels: boolean };

export function whatIsDrawnOf(isSunView: boolean, camera: CameraPreset, lens: Lens = "roof"): Drawn {
  const isRoof = lens === "roof";
  if (!isSunView) return { keptClear: true, edgeLabels: isRoof };
  return { keptClear: false, edgeLabels: isRoof && camera === "plan" };
}
