import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Find and outline in the browser tests: the imagery comes from a fixture tile on this machine, never
// from the network (e2e/fixtures.ts stops everything that leaves it).

const TILE = path.resolve(__dirname, "fixtures/imagery-tile.png");
export const IMAGERY = /ibasemaps-api\.arcgis\.com/;
export const A_MAP = 30_000;

/** Every tile of the imagery is the fixture. */
export async function withTheImagery(page: Page): Promise<void> {
  await page.route(IMAGERY, (route) => route.fulfill({ path: TILE, contentType: "image/png" }));
}

export const GEOCODER = /geocode-api\.arcgis\.com/;
const FIXTURES = path.resolve(__dirname, "fixtures");

/** The geocoder answers every search with a fixture: the places of Hinjewadi, or nothing. */
export async function withTheGeocoder(page: Page, answer: "hinjewadi" | "nothing" = "hinjewadi"): Promise<string[]> {
  const asked: string[] = [];
  await page.route(GEOCODER, (route) => {
    asked.push(route.request().url());
    return route.fulfill({ path: path.join(FIXTURES, `geocode-${answer}.json`), contentType: "application/json" });
  });
  return asked;
}

export const roofMap = (page: Page) => page.getByTestId("roof-map");
export const scaleLabel = (page: Page) => page.getByTestId("scale-bar").locator("code");
export const searchField = (page: Page) => page.getByRole("combobox", { name: "Search an address or paste coordinates" });

/** The screen with its map shown. */
export async function findOpened(page: Page): Promise<void> {
  await withTheImagery(page);
  expect((await page.goto("/find"))?.status()).toBe(200);
  await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
}

export const FOOTPRINTS = /tiles\.overturemaps\.org/;
const FOOTPRINTS_FIXTURE = path.resolve(__dirname, "fixtures/footprints-pune.pmtiles");

/**
 * The footprints of Overture come from the fixture, one tile of the pinned release around Pune
 * (tools/footprints.ts), served by the ranges the reader asks for, as the release is.
 */
export async function withTheFootprints(page: Page): Promise<string[]> {
  const archive = readFileSync(FOOTPRINTS_FIXTURE);
  const asked: string[] = [];
  await page.route(FOOTPRINTS, (route) => {
    const range = /bytes=(\d+)-(\d+)/.exec(route.request().headers()["range"] ?? "");
    asked.push(route.request().headers()["range"] ?? "whole");
    if (!range) return route.fulfill({ status: 200, body: archive, contentType: "application/octet-stream", headers: { "accept-ranges": "bytes" } });
    const from = Number(range[1]);
    const to = Math.min(Number(range[2]), archive.length - 1);
    return route.fulfill({
      status: 206,
      body: archive.subarray(from, to + 1),
      contentType: "application/octet-stream",
      headers: { "accept-ranges": "bytes", "content-range": `bytes ${from}-${to}/${archive.length}`, "content-length": String(to - from + 1) },
    });
  });
  return asked;
}
