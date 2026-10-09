// The roof type as a committed edit (plan/reference/functional-inventory.md, 1.1): a roof made sloped
// loses its parapet, as the desktop app's did, and gets the inventory's pitch of 10° where it had none.
import type { Roof } from "../api";

const PITCH_UNLESS_SET = 10;

export function withRoofType(roof: Roof, roofType: Roof["roof_type"]): Roof {
  if (roof.roof_type === roofType) return roof;
  if (roofType !== "sloped_flush") return { ...roof, roof_type: roofType };
  return { ...roof, roof_type: roofType, parapet_h: 0, slope_deg: roof.slope_deg > 0 ? roof.slope_deg : PITCH_UNLESS_SET };
}

type BuiltParts = Pick<Roof, "outline" | "lat" | "lon" | "obstacles" | "source" | "roof_type">;

/** The design's roof after it is built again on Find (#169): the build's outline, place, obstacles and source, and its type
 * through the same rule as the Roof lens, so a roof made sloped on Find is the roof made sloped in the lens is. */
export function roofAfterBuild(open: Roof, built: BuiltParts): Roof {
  const { outline, lat, lon, obstacles, source, roof_type } = built;
  return { ...withRoofType(open, roof_type), outline, lat, lon, obstacles, source };
}
