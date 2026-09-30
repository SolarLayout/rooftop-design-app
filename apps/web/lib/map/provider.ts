// The map behind an interface (plan/reference/map-providers.md, "Build consequence"): the imagery, the
// search and the footprints can change without the flow or the screens changing.

/** Satellite imagery as raster tiles: what the map and, later, the ground of the 3D scene are made of. */
export type Imagery = {
  /** Tile addresses with {z}, {x} and {y}. */
  tiles: readonly string[];
  tileSize: number;
  /** The last zoom the tiles are made at; above it the map enlarges them. */
  maxNativeZoom: number;
  /** The words that must be shown wherever the imagery is. */
  attribution: string;
};

/** A place the search found. */
export type Place = {
  /** The whole address, as the provider gives it. */
  label: string;
  /** What kind of place: a locality, a street, a point of interest; empty when the provider says nothing. */
  kind: string;
  lon: number;
  lat: number;
};

export type SearchOptions = {
  /** Where the map is: places near it come first. */
  near?: { lon: number; lat: number };
  signal?: AbortSignal;
};

export type MapProvider = {
  name: string;
  imagery: Imagery;
  /** Whether the provider's terms let the user trace a building on its imagery and keep the outline. */
  allowsTracing: boolean;
  /** Places for words typed: up to a handful, best first. Empty when nothing was found. */
  search: (query: string, options?: SearchOptions) => Promise<Place[]>;
};
