import { defineConfig } from "@playwright/test";
import { webUrl } from "./stack";

// Software WebGL, so the 3D scene of later phases renders the same on every machine and in CI.
const launchOptions = {
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
};

const WITHOUT_A_PAGE = /api-client\.e2e\.ts$/;

export default defineConfig({
  testDir: "./tests",
  // *.e2e.ts, so that `bun test` (which takes *.test.ts and *.spec.ts) never picks these up.
  testMatch: /.*\.e2e\.ts$/,
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  // Starts the test stack (web 4710, api 4711, or the next free pair) when it is not running, and stops
  // it afterwards only in that case. The developer's stack on 4700 is never used.
  globalSetup: "./global-setup.ts",
  use: {
    // The real port comes from e2e/fixtures.ts when a test begins; this is the value before that.
    baseURL: webUrl(),
    browserName: "chromium",
    launchOptions,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "phone", testIgnore: WITHOUT_A_PAGE, use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
    { name: "tablet", testIgnore: WITHOUT_A_PAGE, use: { viewport: { width: 834, height: 1194 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: "desktop", testIgnore: WITHOUT_A_PAGE, use: { viewport: { width: 1440, height: 900 } } },
    // Tests of the web app's client against the real API. They open no page, so one run is enough.
    { name: "api", testMatch: WITHOUT_A_PAGE },
  ],
});
