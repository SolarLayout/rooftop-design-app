// The fields of the Array lens (plan/phase-05-plan.md, steps 14 and 15, decisions 16 and 20), written
// once from plan/reference/functional-inventory.md, 1.3: which apply to a roof type, their ranges, the
// tilt's hint from the latitude, and what the engine decides unless told (a null in the document).
import type { Range } from "../../components/ui/number-entry";
import { shown } from "../../components/ui/number-entry";
import type { ArraySpec, LayoutResponse, Roof } from "../api";

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

/** The tilt the latitude suggests: the latitude itself, held between 5° and 15° (inventory 1.3). */
export function suggestedTiltOf(latitude: number): number {
  return Math.round(Math.min(15, Math.max(5, Math.abs(latitude))));
}

export function tiltHintOf(latitude: number): string {
  return `Latitude ${shown(Math.abs(latitude), 1)}° ${latitude >= 0 ? "N" : "S"} suggests ${suggestedTiltOf(latitude)}°`;
}

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
  return { value: `${shown(array.row_pitch_m as number, 2)} m`, line: `Shade-free would be ${enginePitch}`, isEngine };
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
