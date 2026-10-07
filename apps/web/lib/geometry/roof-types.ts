// The three roof types of the engine (rooftop_core, `roof_type`), in the words of the boards: chosen on Find and in the
// Roof lens, and named by the in-app help's topic of them. Pure, with nothing to import, so that the help's gate reads it.

export type RoofType = "flat_tilted" | "flat_ew" | "sloped_flush";

export const ROOF_TYPES: readonly { id: RoofType; name: string; short: string; caption: string }[] = [
  { id: "flat_tilted", name: "Flat, tilted rows", short: "Tilted rows", caption: "Rows facing the equator" },
  { id: "flat_ew", name: "Flat, east-west", short: "East-west", caption: "Back-to-back, low tilt" },
  { id: "sloped_flush", name: "Sloped, flush", short: "Sloped", caption: "Modules follow the roof pitch" },
];
