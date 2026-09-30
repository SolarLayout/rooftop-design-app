// The roof type as a committed edit (plan/reference/functional-inventory.md, 1.1): a roof made sloped
// loses its parapet, as the desktop app's did, and gets the inventory's pitch of 10° where it had none.
import type { Roof } from "../api";

const PITCH_UNLESS_SET = 10;

export function withRoofType(roof: Roof, roofType: Roof["roof_type"]): Roof {
  if (roof.roof_type === roofType) return roof;
  if (roofType !== "sloped_flush") return { ...roof, roof_type: roofType };
  return { ...roof, roof_type: roofType, parapet_h: 0, slope_deg: roof.slope_deg > 0 ? roof.slope_deg : PITCH_UNLESS_SET };
}
