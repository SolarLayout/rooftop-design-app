// What the Array lens reads out beside its fields (plan/phase-05-plan.md, steps 14 to 16; the board
// "Studio, Array lens, states"): the words under a value the engine decided, the window's scale, and
// which module the card shows. Pure functions of the stores; the inspector draws what they give.
import type { Tick } from "../../components/ui/SliderTrack";
import { shown, withUnit } from "../../components/ui/number-entry";
import type { Scale } from "../../components/ui/slider-steps";
import type { ArraySpec, Coefficients, DesignResult, LayoutResponse, Module, Roof } from "../api";
import { compassOf } from "../geometry/measure";
import { WINDOW, type Decided } from "./array-fields";

/** A bearing as the board writes it: "180° S". A whole degree stays whole; a computed one keeps its decimal. */
export function bearingOf(degrees: number): string {
  return `${withUnit(shown(degrees, Number.isInteger(degrees) ? 0 : 1), "°")} ${compassOf(degrees)}`;
}

const FOLLOWS: Record<Roof["roof_type"], string> = {
  flat_tilted: "Follows the roof edge closest to the equator",
  flat_ew: "The ridge runs along the roof edge closest to the equator",
  sloped_flush: "Follows the roof edge closest to the equator",
};

/** The azimuth as shown: the engine's with why, or the one given with where the roof edge faces. */
export function azimuthLineOf(array: ArraySpec, layout: LayoutResponse | null, roofType: Roof["roof_type"]): Decided {
  const isEngine = array.azimuth_deg == null;
  const given = isEngine ? null : bearingOf(array.azimuth_deg as number);
  if (!layout) return { value: given, line: null, isEngine };
  if (isEngine) return { value: bearingOf(layout.layout.azimuth), line: FOLLOWS[roofType], isEngine };
  return { value: given, line: `The roof edge closest to the equator faces ${bearingOf(layout.layout.azimuth)}`, isEngine };
}

/** The tilt of a sloped roof: the roof's own pitch, set in the Roof lens. */
export function slopedTiltLineOf(roof: Pick<Roof, "slope_deg" | "slope_azimuth_deg">): { value: string; line: string } {
  return {
    value: withUnit(shown(roof.slope_deg, 0), "°"),
    line: `Follows the roof pitch · ${withUnit(shown(roof.slope_deg, 0), "°")} facing ${bearingOf(roof.slope_azimuth_deg)} · set in the Roof lens`,
  };
}

export function shadedLineOf(allowShaded: boolean): string {
  return allowShaded ? "On: positions shaded inside the window are used too" : "Off: positions shaded inside the window stay empty";
}

/** The shade-free window on one track: solar hours by the quarter, from the earliest start to the latest end. */
export const WINDOW_SCALE: Scale = { min: WINDOW.start.min, max: WINDOW.end.max, step: WINDOW.step };

export const WINDOW_TICKS: readonly Tick[] = [5, 8, 12, 16, 19].map((hour) => ({ value: hour, label: String(hour).padStart(2, "0") }));

/** The window as committed: the start ends at noon and the end begins there (inventory 1.3). */
export function windowCommitted([from, to]: readonly [number, number]): [number, number] {
  return [Math.min(from, WINDOW.start.max), Math.max(to, WINDOW.end.min)];
}

/** A module as the card shows it: the module, its coefficients and the engine's notes about it. */
export type ModuleShown = { module: Module; coefficients: Coefficients; notes: string[] };

/** The module read from a replaced file, and the edit that committed the file. */
export type ReplacedModule = ModuleShown & { edit: number };

type Sources = {
  design: DesignResult | null;
  /** The edit the design belongs to. */
  designEdit: number | null;
  replaced: ReplacedModule | null;
};

/**
 * Which module the card shows: the one read from a replaced file until the design of that edit (or a
 * later one) lands, then the design's equipment; nothing before either.
 */
export function moduleShownOf({ design, designEdit, replaced }: Sources): ModuleShown | null {
  const isReplacedNewer = replaced !== null && (designEdit === null || designEdit < replaced.edit);
  if (replaced && isReplacedNewer) return { module: replaced.module, coefficients: replaced.coefficients, notes: replaced.notes };
  if (!design) return null;
  const { module, coefficients, module_notes } = design.equipment;
  return { module, coefficients, notes: module_notes };
}
