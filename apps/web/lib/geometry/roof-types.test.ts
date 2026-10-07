import { expect, test } from "bun:test";
import type { Roof } from "../api";
import { ROOF_TYPES, type RoofType } from "./roof-types";

test("the roof types are the engine's, each once", () => {
  const engine: readonly Roof["roof_type"][] = ROOF_TYPES.map(({ id }) => id);
  const ours: readonly RoofType[] = (["flat_tilted", "flat_ew", "sloped_flush"] satisfies Roof["roof_type"][]);
  expect([...engine].sort()).toEqual([...ours].sort());
});
