import { defineConfig } from "@playwright/test";
import { webUrl } from "../stack";

// The soak of Present (plan/phase-10-plan.md, step 21, decision 11): one browser, desktop, on the test stack, for half an
// hour; run by `bun tools/present-soak.ts`, never by the check. Software WebGL as the tests have it, unless the soak is
// asked for the machine's own graphics (ROOFTOP_SOAK_GPU=1), which is what a stand would run on.

const SOFTWARE_WEBGL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

export default defineConfig({
  testDir: ".",
  testMatch: /present-soak\.ts$/,
  outputDir: "../test-results/soak",
  timeout: 45 * 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "../global-setup.ts",
  use: {
    baseURL: webUrl(),
    browserName: "chromium",
    launchOptions: { args: process.env.ROOFTOP_SOAK_GPU === "1" ? ["--ignore-gpu-blocklist"] : SOFTWARE_WEBGL },
    trace: "off",
  },
  projects: [{ name: "desktop", use: { viewport: { width: 1440, height: 900 } } }],
});
