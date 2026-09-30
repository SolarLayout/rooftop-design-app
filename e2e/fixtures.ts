import { expect, test as base } from "@playwright/test";
import path from "node:path";
import { webUrl } from "./stack";

// The imagery of the map and of the ground under the 3D roof: every tile is this one fixture (decision D47).
const TILE = path.resolve(__dirname, "fixtures/imagery-tile.png");
export const IMAGERY = /ibasemaps-api\.arcgis\.com/;

const THIS_MACHINE = new Set(["localhost", "127.0.0.1", "[::1]"]);

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

      await use(stopped);

      expect(stopped, "requests that left this machine").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
