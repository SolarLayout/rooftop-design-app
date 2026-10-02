import { expect, test as base } from "@playwright/test";
import path from "node:path";
import { webUrl } from "./stack";

// The imagery of the map and of the ground under the 3D roof: every tile is this one fixture (decision D47).
const TILE = path.resolve(__dirname, "fixtures/imagery-tile.png");
export const IMAGERY = /ibasemaps-api\.arcgis\.com/;

const THIS_MACHINE = new Set(["localhost", "127.0.0.1", "[::1]"]);

// The weather of /api/weather for PVGIS and NASA: the API's own answers for Pune, written by
// `uv run python -m tests.weather_fixtures` in apps/api from the recordings of pytest (decision 13 of
// Phase 8). The test stack's API has downloads off, so a request that is not answered here is refused by
// the API in words; a CSV goes to the API, which reads its text. Any other site is answered with the
// API's error shape here, so that no test ever asks the API for a download.
const WEATHER_FIXTURES = path.resolve(__dirname, "fixtures");
const PUNE = { lat: 18.52, lon: 73.86 };
const SAME_SITE = 1e-3;
const RECORDED_SOURCES = new Set(["pvgis", "nasa"]);

type WeatherAsked = { source?: unknown; lat?: unknown; lon?: unknown };

/** The fixture file that holds the API's answer to *asked*, or null when nothing was recorded for it. */
export function weatherFixtureOf(asked: WeatherAsked): string | null {
  const { source, lat, lon } = asked;
  if (typeof source !== "string" || !RECORDED_SOURCES.has(source)) return null;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (Math.abs(lat - PUNE.lat) > SAME_SITE || Math.abs(lon - PUNE.lon) > SAME_SITE) return null;
  return path.join(WEATHER_FIXTURES, `weather-${source}-pune.json`);
}

function nothingRecorded(asked: WeatherAsked) {
  const message =
    `Nothing was recorded for ${String(asked.source)} at ${String(asked.lat)}, ${String(asked.lon)}: the browser tests ` +
    `have the weather of Pune (${PUNE.lat}, ${PUNE.lon}) alone (e2e/fixtures/weather-*.json).`;
  return { error: { code: "no_weather_recorded", message, field: null } };
}

type Fixtures = {
  /** Requests that tried to leave this machine. Each was stopped; the test fails if there is one. */
  requestsLeavingThisMachine: string[];
};

export const test = base.extend<Fixtures>({
  // The port of the test stack is only known once the global setup has started it, which is after the
  // configuration was read. So the base URL is looked up here, when a test begins.
  baseURL: async ({}, use) => {
    await use(webUrl());
  },

  // Tests never touch the network: anything that is not this machine is stopped and reported. The
  // imagery is the one exception, answered from the fixture tile for the map and for the ground of the
  // scene alike: here, in the one handler, because the handler registered last is asked first.
  requestsLeavingThisMachine: [
    async ({ page }, use) => {
      const stopped: string[] = [];
      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        const isWeb = url.protocol === "http:" || url.protocol === "https:";
        if (!isWeb || THIS_MACHINE.has(url.hostname)) return route.continue();
        if (IMAGERY.test(url.href)) return route.fulfill({ path: TILE, contentType: "image/png" });
        stopped.push(url.href);
        return route.abort();
      });

      // Registered after the guard, so it is asked first; a route a test registers later comes before it.
      await page.route("**/api/weather", (route) => {
        const asked = (route.request().postDataJSON() ?? {}) as WeatherAsked;
        if (asked.source === "csv") return route.continue();
        const fixture = weatherFixtureOf(asked);
        if (fixture) return route.fulfill({ path: fixture, contentType: "application/json" });
        return route.fulfill({ status: 422, json: nothingRecorded(asked) });
      });

      await use(stopped);

      expect(stopped, "requests that left this machine").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
