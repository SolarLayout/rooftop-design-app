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
  // Baselines of the screens, one set for each platform (text is drawn differently on each) and size.
  // They are in the repo: a pull request shows a changed screen as a changed picture.
  snapshotPathTemplate: "./baselines/{platform}/{projectName}/{arg}{ext}",
  // An expectation waits 15 s, not Playwright's 5: under the load of a full check (ten workers, the Studio in software
  // WebGL on three sizes) a navigation in `next dev` or a late layout took longer, and a different test failed in each
  // of four full runs while every one of them passed alone. A negative expectation waits the whole time; there are few.
  expect: { timeout: 15_000, toHaveScreenshot: { maxDiffPixels: 50 } },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // A test that fails is run once more. Under the load of a full check a wait has run out now and then on a test that
  // passes alone; without a retry one such test discarded a run of half an hour. A test that needed the retry is listed
  // as flaky at the end of the run, and is looked at (docs/checks.md): the retry keeps the run, not the flake.
  retries: 1,
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
