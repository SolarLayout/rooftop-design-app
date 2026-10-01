// Selection by raycast (plan/phase-05-plan.md, step 17, decision 10): what a press on each thing of the
// scene selects, and the callouts of a module and of the roof. Pure functions; the components raycast
// and the view store keeps the selection.
import { shown } from "../../components/ui/number-entry";
import type { Layout, PlacedModule } from "../api";
import { areaOf, centroidOf, edgesOf } from "../outline/measure";
import { isRectangle } from "../outline/typed-length";
import type { Selection } from "../stores/view-store";
import type { XY, XYZ } from "./adapter";
import type { Callout } from "./keepout";
import type { HeightAt } from "./obstacles";

/** What a press of the pointer hit in the scene. A module is known by the instance of the instanced mesh. */
export type Picked = { what: "roof" } | { what: "obstacle" | "keepout"; index: number } | { what: "module"; instanceId: number | undefined } | { what: "ground" };

/** What the press selects; null clears the selection. */
export function selectionOfPick(picked: Picked): Selection | null {
  if (picked.what === "roof") return { kind: "roof" };
  if (picked.what === "obstacle" || picked.what === "keepout") return { kind: picked.what, index: picked.index };
  if (picked.what === "module") return picked.instanceId === undefined ? null : { kind: "module", index: picked.instanceId };
  return null;
}

/** A press moves the pointer this many pixels at most between down and up; a drag of the camera that ends on a thing selects nothing. */
export const PRESS_WITHIN = 4;

export const isAPress = (delta: number) => delta <= PRESS_WITHIN;

/** Where a module faces, in words, by the nearest of eight directions. */
const TOWARD = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

const towardOf = (azimuthDeg: number) => TOWARD[((Math.round(azimuthDeg / 45) % 8) + 8) % 8];

/** An angle that was set is whole; one that is not keeps a decimal (guidelines.md, "Numbers and units"). */
const angleOf = (degrees: number) => `${shown(degrees, Number.isInteger(degrees) ? 0 : 1)}°`;

/**
 * The callout of a module: its position counted from one, then its row (a unit on an east-west roof)
 * with its tilt and where its lower edge faces.
 */
export function calloutOfModule(module: PlacedModule, kind: Layout["kind"]): Callout {
  const row = `${kind === "flat_ew" ? "Unit" : "Row"} ${shown(module.row + 1, 0)}`;
  return { title: `Position ${shown(module.idx + 1, 0)}`, detail: `${row} · ${angleOf(module.tilt)} to the ${towardOf(module.azimuth)}` };
}

/** Where the callout of a module is hung: its top, over the middle of its footprint. */
export function anchorOfModule(module: PlacedModule, heightAt: HeightAt): XYZ {
  const x = module.outline.reduce((sum, [px]) => sum + px, 0) / module.outline.length;
  const y = module.outline.reduce((sum, [, py]) => sum + py, 0) / module.outline.length;
  return [x, y, heightAt([x, y]) + module.z_high];
}

/** The callout of the roof: a rectangle by its sides, another shape by its corners; then its area. */
export function calloutOfRoof(outline: readonly XY[]): Callout {
  const corners = outline.map(([x, y]) => ({ x, y }));
  const edges = edgesOf(corners);
  const shape = isRectangle(corners) ? `${shown(Math.max(edges[0], edges[1]), 1)} × ${shown(Math.min(edges[0], edges[1]), 1)} m` : `${corners.length} corners`;
  return { title: "Roof · selected", detail: `${shape} · ${shown(Math.round(areaOf(corners)), 0)} m²` };
}

/** Where the callout of the roof is hung: its centroid, on its surface. */
export function anchorOfRoof(outline: readonly XY[], heightAt: HeightAt): XYZ {
  const { x, y } = centroidOf(outline.map(([px, py]) => ({ x: px, y: py })));
  return [x, y, heightAt([x, y])];
}
