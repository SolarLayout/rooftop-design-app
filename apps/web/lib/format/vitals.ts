// The quantities of the vitals, as they are shown: each a number and its unit
// (docs/design/guidelines.md, "Numbers and units").
import { shown, withUnit } from "../../components/ui/number-entry";

export type Quantity = {
  /** The number as it is shown. */
  number: string;
  /** What follows it, smaller: a unit, or "of 790". */
  unit?: string;
};

/** A share as percent. The point is moved in the decimal number, so that nothing is rounded twice. */
const percentOf = (share: number) => Number(`${share}e2`);

export const energy = (mwh: number): Quantity => ({ number: shown(mwh, 1), unit: "MWh" });
export const dcCapacity = (kwp: number): Quantity => ({ number: shown(kwp, 2), unit: "kWp" });
export const acCapacity = (kw: number): Quantity => ({ number: shown(kw, 0), unit: "kW" });
export const dcAcRatio = (ratio: number): Quantity => ({ number: shown(ratio, 2) });
export const modulesUsed = (used: number, positions: number): Quantity => ({
  number: shown(used, 0),
  unit: `of ${shown(positions, 0)}`,
});
/** `share` is the performance ratio as the API gives it: 0.8655. */
export const performanceRatio = (share: number): Quantity => ({ number: shown(percentOf(share), 1), unit: "%" });
export const specificYield = (kwhPerKwp: number): Quantity => ({ number: shown(kwhPerKwp, 0), unit: "kWh/kWp" });

export const roofArea = (squareMetres: number): Quantity => ({ number: shown(squareMetres, 0), unit: "m²" });
export const positions = (count: number): Quantity => ({ number: shown(count, 0), unit: "modules" });
/** The DC capacity if a module stood on every position. `wattsOfAModule` is its nominal power. */
export const capacityIfAllWereUsed = (count: number, wattsOfAModule: number): Quantity =>
  dcCapacity((count * wattsOfAModule) / 1000);

/** A quantity in one piece: for a screen reader, and wherever number and unit are not set apart. */
export const said = ({ number, unit }: Quantity): string => withUnit(number, unit);
