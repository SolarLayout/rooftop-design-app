// The three roof types of the engine (rooftop_core, `roof_type`), in the words of the boards: chosen on Find and in the
// Roof lens, and named by the in-app help's topic of them. Pure, with nothing to import, so that the help's gate reads it.
// One name a thing (D112): the long name in every line and list, as Find asks; the short name on the Roof step's buttons.

export type RoofType = "flat_tilted" | "flat_ew" | "sloped_flush";

export const ROOF_TYPES: readonly { id: RoofType; short: string; caption?: string }[] = [
  { id: "flat_tilted", short: "Tilted rows" },
  { id: "flat_ew", short: "East-west", caption: "Back to back, low tilt" },
  { id: "sloped_flush", short: "Sloped", caption: "Modules follow the roof pitch" },
];

/** The long name: "Flat, rows facing south", the rows facing the equator of the roof's hemisphere. */
export function roofTypeNameOf(id: RoofType, latitude: number): string {
  if (id === "flat_tilted") return `Flat, rows facing ${latitude >= 0 ? "south" : "north"}`;
  return id === "flat_ew" ? "Flat, rows facing east and west" : "Sloped";
}
