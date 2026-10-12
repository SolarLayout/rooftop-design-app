// The fields of the Array lens (plan/phase-05-plan.md, steps 14 and 15, decisions 16 and 20), written
// once from plan/reference/functional-inventory.md, 1.3: which apply to a roof type, their ranges, the
// tilt's hint from the latitude, and what the engine decides unless told (a null in the document).
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import { withUnit } from "../../components/ui/number-entry";
import type { ArraySpec, LayoutResponse, Roof } from "../api";
import { dateOf, designDayOfYear } from "../flow/sun-time";
import { hourOf } from "../geometry/keepout";
import { ARRAY_DEFAULTS } from "./defaults";
import { DEFAULT, hintOf, setByOfValue, type SetBy } from "./set-by";

export type MountingId = "tilt_deg" | "orientation" | "modules_in_tilt" | "clearance_m" | "ew_tilt_deg" | "ew_ridge_gap_m";
export type SpacingId = "row_pitch_m" | "azimuth_deg";

/** A range with both ends: a slider and a stepper stop at them. */
export type Bounded = Range & { min: number; max: number };

export const ARRAY_RANGES: Record<"tilt_deg" | "modules_in_tilt" | "clearance_m" | "azimuth_deg" | "ew_tilt_deg" | "ew_ridge_gap_m" | "row_pitch_m", Bounded> = {
  tilt_deg: { min: 0, max: 45, decimals: 0 },
  modules_in_tilt: { min: 1, max: 4, decimals: 0 },
  clearance_m: { min: 0, max: 3, decimals: 2 },
  azimuth_deg: { min: 0, max: 359.9, decimals: 1 },
  ew_tilt_deg: { min: 0, max: 30, decimals: 0 },
  ew_ridge_gap_m: { min: 0, max: 2, decimals: 2 },
  row_pitch_m: { min: 0.5, max: 30, decimals: 2 },
};

/** The shade-free window, in solar hours by the quarter: the start from 5 to 12, the end from 12 to 19. */
export const WINDOW = { start: { min: 5, max: 12 }, end: { min: 12, max: 19 }, step: 0.25 };

/** The mounting fields that apply to a roof type, in the order of the board. */
export function mountingOf(roofType: Roof["roof_type"]): MountingId[] {
  if (roofType === "flat_ew") return ["ew_tilt_deg", "ew_ridge_gap_m", "clearance_m"];
  if (roofType === "sloped_flush") return ["orientation", "modules_in_tilt"];
  return ["tilt_deg", "orientation", "modules_in_tilt", "clearance_m"];
}

/** The spacing fields that apply: the engine decides each unless told. */
export function spacingOf(roofType: Roof["roof_type"]): SpacingId[] {
  if (roofType === "flat_ew") return ["azimuth_deg"];
  if (roofType === "sloped_flush") return [];
  return ["row_pitch_m", "azimuth_deg"];
}

export type Decided = { value: string | null; line: string | null; isEngine: boolean };

/** The row pitch as shown: the engine's with its reasons, or the one given with what shade-free would be. */
export function pitchLineOf(array: ArraySpec, layout: LayoutResponse | null): Decided {
  const isEngine = array.row_pitch_m == null;
  if (!layout) return { value: isEngine ? null : `${shown(array.row_pitch_m as number, 2)} m`, line: null, isEngine };
  const enginePitch = `${shown(layout.layout.pitch, 2)} m`;
  if (isEngine) {
    const angle = layout.readouts.profile_angle_deg;
    const parts = [`GCR ${shown(layout.readouts.gcr, 2)}`, ...(angle == null ? [] : [`profile angle ${shown(angle, 1)}°`])];
    return { value: enginePitch, line: `Shade-free · ${parts.join(" · ")}`, isEngine };
  }
  // The layout is at the pitch given: what shade-free would be is the engine's own, from the readouts (#179, item 9).
  const free = layout.readouts.shade_free_pitch_m;
  return { value: `${shown(array.row_pitch_m as number, 2)} m`, line: free == null ? null : `Shade-free spacing ${shown(free, 2)} m`, isEngine };
}

/** The switch of the pitch: off fills the field with the engine's last pitch, on hands it back to the engine. */
export function withPitchDecided(array: ArraySpec, layout: LayoutResponse | null, byEngine: boolean): ArraySpec {
  if (byEngine) return array.row_pitch_m == null ? array : { ...array, row_pitch_m: null };
  if (!layout) return array;
  return { ...array, row_pitch_m: layout.layout.pitch };
}

/** The switch of the azimuth the same, with the roof edge's azimuth the layout used. */
export function withAzimuthDecided(array: ArraySpec, layout: LayoutResponse | null, byEngine: boolean): ArraySpec {
  if (byEngine) return array.azimuth_deg == null ? array : { ...array, azimuth_deg: null };
  if (!layout) return array;
  return { ...array, azimuth_deg: layout.layout.azimuth };
}

export type DesignDay = "winter" | "june" | "march";

const windowWordsOf = (from: number, to: number) => `${hourOf(from)} to ${hourOf(to)}`;

/** The days of the year the board offers beside the winter solstice (inventory 1.3). */
const DAY_OF: Record<Exclude<DesignDay, "winter">, number> = { june: 172, march: 80 };

export function designDayOf(array: ArraySpec): DesignDay {
  if (array.design_doy === DAY_OF.june) return "june";
  if (array.design_doy === DAY_OF.march) return "march";
  return "winter";
}

export function withDesignDay(array: ArraySpec, day: DesignDay): ArraySpec {
  const doy = day === "winter" ? null : DAY_OF[day];
  return array.design_doy === doy ? array : { ...array, design_doy: doy };
}

/** The design days in the words of the board: the segmented control's, and the summary's in lower case. */
export const DESIGN_DAY_WORDS: Record<DesignDay, string> = { winter: "Winter solstice", june: "21 Jun", march: "21 Mar" };
const dayWordsOf = (day: DesignDay) => (day === "winter" ? "winter solstice" : DESIGN_DAY_WORDS[day]);

// Who set each field of the Array step, and the facts of its sections on one line (V2 · 3).

const MOUNTING_SHOWN: Record<MountingId, { decimals: number; unit?: string }> = {
  tilt_deg: { decimals: 0, unit: "°" },
  orientation: { decimals: 0 },
  modules_in_tilt: { decimals: 0 },
  clearance_m: { decimals: 2, unit: "m" },
  ew_tilt_deg: { decimals: 0, unit: "°" },
  ew_ridge_gap_m: { decimals: 2, unit: "m" },
};

/** Who set each mounting field of the roof type, in the order of the board. */
export function mountingSetByOf(array: ArraySpec, roofType: Roof["roof_type"]): Partial<Record<MountingId, SetBy>> {
  return Object.fromEntries(
    mountingOf(roofType).map((id) => [
      id,
      id === "orientation" ? setByOfValue(array.orientation, ARRAY_DEFAULTS.orientation, { words: ARRAY_DEFAULTS.orientation }) : setByOfValue(array[id], ARRAY_DEFAULTS[id], MOUNTING_SHOWN[id]),
    ]),
  );
}

/** What stands in place of a spacing the engine decides, said as the default a value given took the place of. */
const DECIDED_BY_THE_APP: Record<SpacingId, string> = { row_pitch_m: "shade-free", azimuth_deg: "the roof edge's" };

/** Who set each spacing: the engine while it is null, the user once a value is given. */
export function spacingSetByOf(array: ArraySpec, roofType: Roof["roof_type"]): Partial<Record<SpacingId, SetBy>> {
  return Object.fromEntries(spacingOf(roofType).map((id) => [id, array[id] == null ? DEFAULT : { kind: "yours", byDefault: DECIDED_BY_THE_APP[id] }]));
}

/** Who set the shade-free window, the design day and whether shaded positions are used. */
export function windowSetByOf(array: ArraySpec): { window: SetBy; design_day: SetBy; allow_shaded: SetBy } {
  const isDefaultWindow = array.window_start_h === ARRAY_DEFAULTS.window_start_h && array.window_end_h === ARRAY_DEFAULTS.window_end_h;
  return {
    window: isDefaultWindow ? DEFAULT : { kind: "yours", byDefault: windowWordsOf(ARRAY_DEFAULTS.window_start_h, ARRAY_DEFAULTS.window_end_h) },
    design_day: setByOfValue(designDayOf(array), "winter", { words: dayWordsOf("winter") }),
    allow_shaded: setByOfValue(array.allow_shaded, ARRAY_DEFAULTS.allow_shaded, { words: "off" }),
  };
}

/** The mounting on one line: the tilt (the roof's pitch on a sloped roof), the orientation, the modules in tilt. */
export function mountingFactsOf(array: ArraySpec, roof: Pick<Roof, "roof_type" | "slope_deg">): string {
  const inTilt = `${shown(array.modules_in_tilt, 0)} in tilt`;
  if (roof.roof_type === "flat_ew") return `East-west ${shown(array.ew_tilt_deg, 0)}° · ridge gap ${withUnit(shown(array.ew_ridge_gap_m, 2), "m")}`;
  if (roof.roof_type === "sloped_flush") return `Flush at ${shown(roof.slope_deg, 0)}° · ${array.orientation} · ${inTilt}`;
  return `Tilt ${shown(array.tilt_deg, 0)}° · ${array.orientation} · ${inTilt}`;
}

/** The usual thing, said after Default (V2 · 7): why the app's value is what it is. */
const USUAL: Partial<Record<MountingId, string>> = { tilt_deg: "low for wind on a flat roof", modules_in_tilt: "one module in each row" };

/** What stands under a mounting field: "Default · low for wind on a flat roof", or the user's "Yours · default 15°". */
export const mountingHintOf = (id: MountingId, setBy: SetBy): string => (setBy.kind === "default" && USUAL[id] ? `${hintOf(setBy)} · ${USUAL[id]}` : hintOf(setBy));

/** The spacing as the last layout used it, on one line; null before one came. */
export function spacingFactsOf(array: ArraySpec, layout: LayoutResponse | null, roofType: Roof["roof_type"]): string | null {
  if (!layout) return null;
  if (roofType === "flat_tilted") return `Rows ${shown(array.row_pitch_m ?? layout.layout.pitch, 2)} m apart · shade-free hours ${windowWordsOf(array.window_start_h, array.window_end_h)}`;
  if (roofType === "sloped_flush") return `Shade-free hours ${windowWordsOf(array.window_start_h, array.window_end_h)}`;
  return `Direction ${shown(array.azimuth_deg ?? layout.layout.azimuth, 1)}° · shade-free hours ${windowWordsOf(array.window_start_h, array.window_end_h)}`;
}

/** The design days by their date: the winter solstice of the hemisphere, 21 Jun and 21 Mar (V2 · 7). */
export function designDayLabelsOf(latitude: number): Record<DesignDay, string> {
  return { winter: dateOf(designDayOfYear(null, latitude)).short, june: "21 Jun", march: "21 Mar" };
}

/** The one sentence of Spacing: why the rows stand where they do. None before a layout, or where the roof has no row pitch. */
export function spacingSentenceOf(array: ArraySpec, layout: LayoutResponse | null, roofType: Roof["roof_type"], latitude: number): string | null {
  if (!layout || roofType !== "flat_tilted") return null;
  const apart = `${shown(layout.layout.pitch, 2)} m apart`;
  if (array.row_pitch_m != null) {
    const free = layout.readouts.shade_free_pitch_m;
    return `Rows stand ${apart}.${free == null ? "" : ` The shade-free spacing is ${shown(free, 2)} m.`}`;
  }
  return `Rows stand ${apart} so that they do not shade each other from ${windowWordsOf(array.window_start_h, array.window_end_h)} on ${designDayLabelsOf(latitude)[designDayOf(array)]}.`;
}
