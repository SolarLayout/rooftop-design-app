import { test as base } from "@playwright/test";
import { webUrl } from "./stack";

// The port of the test stack is only known once the global setup has started it, which is after the
// configuration was read. So the base URL is looked up here, when a test begins.
export const test = base.extend({
  baseURL: async ({}, use) => {
    await use(webUrl());
  },
});

export { expect } from "@playwright/test";
