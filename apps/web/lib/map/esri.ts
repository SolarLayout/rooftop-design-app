// Esri World Imagery and Esri geocoding, of the ArcGIS Location Platform (decision D13). Verified with
// the key of the app on 2026-09-29: plan/reference/map-providers.md, "Verified with our own key".
import type { MapProvider, Place, SearchOptions } from "./provider";

export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

// The raster source of the style arcgis/imagery/standard: 256 px tiles, native to zoom 19.
export const IMAGERY_HOST = "https://ibasemaps-api.arcgis.com";
const IMAGERY_TILES = `${IMAGERY_HOST}/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`;
export const GEOCODER_HOST = "https://geocode-api.arcgis.com";
const GEOCODER = `${GEOCODER_HOST}/arcgis/rest/services/World/GeocodeServer/findAddressCandidates`;

/** What Esri asks to be shown with the imagery. */
export const IMAGERY_ATTRIBUTION = "Powered by Esri · Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community";

const PLACES_AT_MOST = 5;

/** The key of the app, put into the page at build time. Empty when the machine has none. */
export const KEY_OF_THE_APP = process.env.NEXT_PUBLIC_ESRI_API_KEY ?? "";

export class SearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchError";
  }
}

type Candidate = { address?: unknown; location?: { x?: unknown; y?: unknown }; score?: unknown };

/** The places of an answer of the geocoder, in its order; an answer of another shape is a fault. */
export function placesOf(answer: unknown): Place[] {
  if (typeof answer !== "object" || answer === null) throw new SearchError("The search answered in a shape that cannot be read.");
  const { error, candidates } = answer as { error?: { message?: unknown }; candidates?: unknown };
  if (error) throw new SearchError(typeof error.message === "string" ? error.message : "The search is not available.");
  if (!Array.isArray(candidates)) throw new SearchError("The search answered in a shape that cannot be read.");
  return candidates.flatMap((candidate: Candidate) => {
    const { address, location } = candidate;
    if (typeof address !== "string" || typeof location?.x !== "number" || typeof location?.y !== "number") return [];
    return [{ label: address, lon: location.x, lat: location.y }];
  });
}

/** The address the geocoder is asked at, for `query` near `near`. */
export function searchUrl(key: string, query: string, near?: SearchOptions["near"]): string {
  const url = new URL(GEOCODER);
  url.searchParams.set("f", "json");
  url.searchParams.set("singleLine", query);
  url.searchParams.set("maxLocations", String(PLACES_AT_MOST));
  url.searchParams.set("outFields", "Match_addr,Type");
  if (near) url.searchParams.set("location", `${near.lon},${near.lat}`);
  url.searchParams.set("token", key);
  return url.href;
}

/** The provider with a key; null without one, so that the screen says so and goes on without the map. */
export function esriProvider(key: string, fetcher: Fetch = (input, init) => globalThis.fetch(input, init)): MapProvider | null {
  if (key === "") return null;
  return {
    name: "Esri",
    imagery: { tiles: [`${IMAGERY_TILES}?token=${key}`], tileSize: 256, maxNativeZoom: 19, attribution: IMAGERY_ATTRIBUTION },
    // Esri grants the right to trace features from the World Imagery map (map-providers.md).
    allowsTracing: true,
    async search(query, { near, signal } = {}) {
      let response: Response;
      try {
        response = await fetcher(searchUrl(key, query, near), { signal, cache: "no-store" });
      } catch (cause) {
        if (signal?.aborted) throw cause;
        throw new SearchError("The search cannot be reached. Check the connection and try again.");
      }
      if (!response.ok) throw new SearchError(`The search answered ${response.status}. Try again in a moment.`);
      return placesOf(await response.json());
    },
  };
}
