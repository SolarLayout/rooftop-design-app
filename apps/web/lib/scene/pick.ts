// Selection by raycast (plan/phase-05-plan.md, step 17, decision 10): what a press on each thing of the
// scene selects, and the callouts of a module and of the roof. Pure functions; the components raycast
// and the view store keeps the selection.
import { shown } from "../../components/ui/number-entry";
import type { CableRow, Layout, PlacedModule } from "../api";
import { areaOf, centroidOf, edgesOf } from "../geometry/measure";
import { isRectangle } from "../geometry/typed-length";
import type { Selection } from "../stores/view-store";
import type { XY, XYZ } from "../geometry/adapter";
import type { Callout } from "../geometry/keepout";
import type { HeightAt } from "../geometry/obstacles";
import type { Wired } from "../stores/string-colours";

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

/** The string that wires a position, by the position's idx; null for a position the option does not use. */
export function stringOfPosition<S extends Pick<Wired, "modules">>(strings: readonly S[], idx: number): S | null {
  return strings.find((string) => string.modules.includes(idx)) ?? null;
}

/**
 * What a press selects in the Strings lens while the strings are on the roof (plan/phase-07-plan.md, decision 13): on
 * a position an option's string wires, the string; on any other, what it selects in every lens. The instance is the
 * position's index in the layout, *idxs* the idx of each.
 */
export function selectionOfPickedString(picked: Picked, idxs: readonly number[], strings: readonly Pick<Wired, "label" | "modules">[]): Selection | null {
  if (picked.what === "module" && picked.instanceId !== undefined) {
    const idx = idxs[picked.instanceId];
    const string = idx === undefined ? null : stringOfPosition(strings, idx);
    if (string) return { kind: "string", label: string.label };
  }
  return selectionOfPick(picked);
}

/**
 * The callout of a string (the boards "Strings on the roof" and "V2 · 6"): its name and its MPPT, with its inverter when
 * the option has more than one; its modules, how much near shading costs them, as the run's losses per position have
 * it, then its Voc cold and its metres of cable as the engine's cable schedule has them, to the whole volt and metre.
 */
export function calloutOfString(
  string: Pick<Wired, "label" | "modules" | "inverter" | "mppt">,
  cable: CableRow | undefined,
  { inverters = 1, losses }: { inverters?: number; losses?: readonly number[] } = {},
): Callout {
  const inverter = inverters > 1 ? `${cable?.inverter ?? `INV-${string.inverter}`}, ` : "";
  const title = `String ${string.label} · ${inverter}MPPT ${shown(string.mppt, 0)}`;
  const lost = losses === undefined || string.modules.length === 0 ? null : string.modules.reduce((sum, idx) => sum + (losses[idx] ?? 0), 0) / string.modules.length;
  const shade = lost === null ? [] : [`${shown(lost, 1)} % shaded`];
  if (!cable) return { title, detail: [`${shown(string.modules.length, 0)} modules`, ...shade].join(" · ") };
  return { title, detail: [`${shown(cable.modules, 0)} modules`, ...shade, `Voc cold ${shown(cable.voc_cold_v, 0)} V`, `${shown(cable.length_m, 0)} m of cable`].join(" · ") };
}

/** Where the callout of a string is hung: over its module nearest the middle of its modules; null for a string of none. */
export function anchorOfString(string: Pick<Wired, "modules">, modules: readonly PlacedModule[], heightAt: HeightAt): XYZ | null {
  const own = modules.filter((module) => string.modules.includes(module.idx));
  if (own.length === 0) return null;
  const middles = own.map((module) => anchorOfModule(module, heightAt));
  const [mx, my] = [middles.reduce((sum, [x]) => sum + x, 0) / middles.length, middles.reduce((sum, [, y]) => sum + y, 0) / middles.length];
  const nearest = middles.reduce((best, at) => (Math.hypot(at[0] - mx, at[1] - my) < Math.hypot(best[0] - mx, best[1] - my) ? at : best));
  return nearest;
}
