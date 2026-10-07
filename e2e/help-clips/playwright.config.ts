import { defineConfig } from "@playwright/test";
import { webUrl } from "../stack";

// The clips of the how-tos (Phase 15): recorded from the app on the test stack by `bun help:clips`, never by the check. One
// browser at twice the pixels, software WebGL as the tests have it; each clip recorded a frame at a time (README.md).

const SOFTWARE_WEBGL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

export default defineConfig({
  testDir: ".",
  testMatch: /help-clips\.ts$/,
  outputDir: "../test-results/help-clips",
  timeout: 10 * 60_000,
  expect: { timeout: 30_000 },
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "../global-setup.ts",
  use: {
    baseURL: webUrl(),
    browserName: "chromium",
    deviceScaleFactor: 2,
    launchOptions: { args: SOFTWARE_WEBGL },
    trace: "off",
  },
});
