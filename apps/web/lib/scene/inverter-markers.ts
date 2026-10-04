// The inverters on the roof (plan/phase-07-plan.md, decision 13; the board "Strings on the roof"): a small box in
// the palette's inverterMarker at each place the engine gives the chosen option's inverters, and a chip "INV-1"
// over its top, placed by the Projector. Pure, in the engine's metres.
import type { InverterPlace } from "../api";
import type { XY, XYZ } from "../geometry/adapter";

/** The box on the roof: a marker, not the inverter's size, as the board draws it. In metres. */
export const INVERTER_BOX = { east: 2, north: 1, height: 1.2 } as const;

export type InverterMarker = {
  label: string;
  /** The middle of the box, on the roof at its place. */
  middle: XYZ;
  /** The middle of its top, where the chip stands. */
  top: XYZ;
};

export function inverterMarkersOf(inverters: readonly InverterPlace[], heightAt: (point: XY) => number): InverterMarker[] {
  return inverters.map(({ label, position: [x, y] }) => {
    const ground = heightAt([x, y]);
    return { label, middle: [x, y, ground + INVERTER_BOX.height / 2], top: [x, y, ground + INVERTER_BOX.height] };
  });
}
