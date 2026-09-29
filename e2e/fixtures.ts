import { expect, test as base } from "@playwright/test";
import { webUrl } from "./stack";

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

  // Tests never touch the network: anything that is not this machine is stopped and reported.
  requestsLeavingThisMachine: [
    async ({ page }, use) => {
      const stopped: string[] = [];
      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        const isWeb = url.protocol === "http:" || url.protocol === "https:";
        if (!isWeb || THIS_MACHINE.has(url.hostname)) return route.continue();
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
