// What the stage draws, by view: the Sun view shows the sun and the shadows, without the kept-clear areas of the layout
// and, in 3D, without the edge labels (the boards "Studio, Sun lens", kept by "V2 · 7"). The plan keeps its labels on
// every step: it is the view things are measured in.
import type { CameraPreset } from "../stores/view-store";

export type Drawn = { keptClear: boolean; edgeLabels: boolean };

export function whatIsDrawnOf(isSunView: boolean, camera: CameraPreset): Drawn {
  if (!isSunView) return { keptClear: true, edgeLabels: true };
  return { keptClear: false, edgeLabels: camera === "plan" };
}
