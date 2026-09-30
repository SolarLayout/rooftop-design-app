import { describe, expect, test } from "bun:test";
import { esriProvider, IMAGERY_ATTRIBUTION, placesOf, searchUrl, SearchError, type Fetch } from "./esri";

const KEY = "a-key-of-the-test";

const ANSWER = {
  spatialReference: { wkid: 4326 },
  candidates: [
    { address: "Hinjewadi Phase 2, Pune, Maharashtra", location: { x: 73.7124, y: 18.5954 }, score: 100, attributes: { Type: "Locality" } },
    { address: "Hinjewadi Phase 2 Rd, Hinjewadi, Pune", location: { x: 73.7101, y: 18.5921 }, score: 98 },
  ],
};

function fetcher(answer: unknown, status = 200): { fetcher: Fetch; calls: { url: string; init?: RequestInit }[] } {
  const calls: { url: string; init?: RequestInit }[] = [];
  return {
    calls,
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(answer), { status, headers: { "content-type": "application/json" } });
    },
  };
}

describe("the provider", () => {
  test("without a key there is none: the screen says so and goes on without the map", () => {
    expect(esriProvider("")).toBeNull();
  });

  test("the tiles carry the key and are native to zoom 19; the attribution is Esri's", () => {
    const provider = esriProvider(KEY)!;

    expect(provider.imagery.tiles).toEqual([
      `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${KEY}`,
    ]);
    expect(provider.imagery).toMatchObject({ tileSize: 256, maxNativeZoom: 19, attribution: IMAGERY_ATTRIBUTION });
    expect(provider.allowsTracing).toBe(true);
    expect(provider.name).toBe("Esri");
  });
});

describe("the search", () => {
  test("asks the geocoder for a handful of places near the map, with the key", () => {
    const url = new URL(searchUrl(KEY, "Hinjewadi Phase 2", { lon: 73.86, lat: 18.52 }));

    expect(url.origin + url.pathname).toBe("https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      f: "json",
      singleLine: "Hinjewadi Phase 2",
      maxLocations: "5",
      outFields: "Match_addr,Type",
      location: "73.86,18.52",
      token: KEY,
    });
  });

  test("without a place to be near, none is sent", () => {
    expect(new URL(searchUrl(KEY, "Pune")).searchParams.has("location")).toBe(false);
  });

  test("the places of an answer, in its order, with their address and their place", () => {
    expect(placesOf(ANSWER)).toEqual([
      { label: "Hinjewadi Phase 2, Pune, Maharashtra", lon: 73.7124, lat: 18.5954 },
      { label: "Hinjewadi Phase 2 Rd, Hinjewadi, Pune", lon: 73.7101, lat: 18.5921 },
    ]);
  });

  test("nothing found is an empty list, not a fault", () => {
    expect(placesOf({ candidates: [] })).toEqual([]);
  });

  test("a candidate without an address or a place is left out", () => {
    expect(placesOf({ candidates: [{ address: "Somewhere" }, { location: { x: 1, y: 2 } }, ANSWER.candidates[0]] })).toHaveLength(1);
  });

  test("an error of the geocoder is thrown with its words", () => {
    expect(() => placesOf({ error: { code: 498, message: "Invalid token." } })).toThrow(new SearchError("Invalid token."));
  });

  test("an answer of another shape is a fault", () => {
    expect(() => placesOf({ candidates: "none" })).toThrow(SearchError);
    expect(() => placesOf(null)).toThrow(SearchError);
  });

  test("the provider fetches and hands out the places", async () => {
    const { fetcher: fetch, calls } = fetcher(ANSWER);
    const provider = esriProvider(KEY, fetch)!;

    const places = await provider.search("Hinjewadi Phase 2", { near: { lon: 73.86, lat: 18.52 } });

    expect(places).toHaveLength(2);
    expect(calls).toHaveLength(1);
    expect(new URL(calls[0].url).searchParams.get("singleLine")).toBe("Hinjewadi Phase 2");
    expect(calls[0].init).toMatchObject({ cache: "no-store" });
  });

  test("a search that cannot be reached says so", async () => {
    const provider = esriProvider(KEY, async () => {
      throw new TypeError("Failed to fetch");
    })!;

    await expect(provider.search("Pune")).rejects.toThrow(new SearchError("The search cannot be reached. Check the connection and try again."));
  });

  test("a search that was given up is thrown as it is", async () => {
    const control = new AbortController();
    const provider = esriProvider(KEY, async (_url, init) => {
      control.abort();
      throw init?.signal?.reason ?? new Error("aborted");
    })!;

    const thrown = await provider.search("Pune", { signal: control.signal }).catch((error: unknown) => error);

    expect(thrown).not.toBeInstanceOf(SearchError);
  });

  test("an answer that is not ok says its status", async () => {
    const { fetcher: fetch } = fetcher({}, 503);
    const provider = esriProvider(KEY, fetch)!;

    await expect(provider.search("Pune")).rejects.toThrow(new SearchError("The search answered 503. Try again in a moment."));
  });
});
