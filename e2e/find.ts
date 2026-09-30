import { expect, type Page } from "@playwright/test";
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

export const roofMap = (page: Page) => page.getByTestId("roof-map");

/** The screen with its map shown. */
export async function findOpened(page: Page): Promise<void> {
  await withTheImagery(page);
  expect((await page.goto("/find"))?.status()).toBe(200);
  await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
}
