// What the stage draws, by lens and view: the Sun lens shows the sun and the shadows, without the kept-clear
// areas of the layout and, in 3D, without the edge labels (the boards "Studio, Sun lens"). The plan keeps its
// labels in every lens: it is the view things are measured in.
import type { Lens } from "../routes";
import type { CameraPreset } from "../stores/view-store";

export type Drawn = { keptClear: boolean; edgeLabels: boolean };

export function whatIsDrawnOf(lens: Lens, camera: CameraPreset): Drawn {
  if (lens !== "sun") return { keptClear: true, edgeLabels: true };
  return { keptClear: false, edgeLabels: camera === "plan" };
}
