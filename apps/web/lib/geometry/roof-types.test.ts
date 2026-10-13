import { expect, test } from "bun:test";
import type { Roof } from "../api";
import { ROOF_TYPES, roofTypeNameOf, type RoofType } from "./roof-types";

test("the roof types are the engine's, each once", () => {
  const engine: readonly Roof["roof_type"][] = ROOF_TYPES.map(({ id }) => id);
  const ours: readonly RoofType[] = (["flat_tilted", "flat_ew", "sloped_flush"] satisfies Roof["roof_type"][]);
  expect([...engine].sort()).toEqual([...ours].sort());
});

test("each type has one long name, for lines and lists, the rows facing the equator of the roof's hemisphere (D112)", () => {
  expect(ROOF_TYPES.map(({ id }) => roofTypeNameOf(id, 18.52))).toEqual(["Flat, rows facing south", "Flat, rows facing east and west", "Sloped"]);
  expect(roofTypeNameOf("flat_tilted", -33.9)).toBe("Flat, rows facing north");
});

test("and one short name, for the Roof step's buttons (D112)", () => {
  expect(ROOF_TYPES.map(({ short }) => short)).toEqual(["Tilted rows", "East-west", "Sloped"]);
});
