import { defineConfig } from "@playwright/test";
import { webUrl } from "../stack";

// The pictures of the how-tos (D81): taken from the app on the test stack by `bun help:pictures`, never by the check. One
// browser, at twice the pixels; software WebGL as the tests have it. The window of each how-to is its own (tools/help/pictures.ts).

const SOFTWARE_WEBGL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

export default defineConfig({
  testDir: ".",
  testMatch: /help-pictures\.ts$/,
  outputDir: "../test-results/help-pictures",
  timeout: 5 * 60_000,
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
