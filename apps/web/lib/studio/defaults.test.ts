import { describe, expect, test } from "bun:test";
import openapi from "@rooftop/api-types/openapi.json";
import type { Roof } from "../api";
import { ARRAY_DEFAULTS, roofDefaultOf, ROOF_DEFAULTS } from "./defaults";
import { AC_CABLE_DEFAULT } from "./inverter-fields";

// The app's values of a design are the API's (V2 · 3): a default changed there and not here would call the app's value the user's.

type Schema = { properties: Record<string, { default?: unknown }> };
const schemas = openapi.components.schemas as unknown as Record<string, Schema>;
const defaultOf = (schema: string, field: string) => schemas[schema]?.properties[field]?.default;

describe("the defaults", () => {
  test("of the roof are the API's", () => {
    for (const [id, value] of Object.entries(ROOF_DEFAULTS)) expect([id, defaultOf("Roof", id)]).toEqual([id, value]);
  });

  test("of the array are the API's", () => {
    for (const [id, value] of Object.entries(ARRAY_DEFAULTS)) expect([id, defaultOf("ArraySpec", id)]).toEqual([id, value]);
  });

  test("of the AC cable is the API's", () => {
    expect(defaultOf("Project", "ac_cable_m")).toBe(AC_CABLE_DEFAULT);
  });

  test("a sloped roof has no parapet and a pitch of 10° by the roof type's rule", () => {
    const sloped = { roof_type: "sloped_flush" } as Roof;
    const flat = { roof_type: "flat_tilted" } as Roof;
    expect([roofDefaultOf(sloped, "parapet_h"), roofDefaultOf(sloped, "slope_deg")]).toEqual([0, 10]);
    expect([roofDefaultOf(flat, "parapet_h"), roofDefaultOf(flat, "slope_deg")]).toEqual([0.9, 0]);
  });
});
