// The key of pytest-testmon's data (apps/api/.testmondata): what testmon does not track itself.
//
// Testmon fingerprints the Python code each test executes, and knows the Python version and the list of
// installed packages without their patch versions. It does not see the data files the tests read (the
// fixtures, the samples of rooftop_core), the weather fixtures of the browser tests that a pytest holds
// to the API's answers (e2e/fixtures/weather-*.json), the files of the web app a pytest holds to the engine (the library's
// catalog, the pool of the inverter for the roof, D118; Home's figures of the demo, D120), the pytest options in pyproject.toml, uv.lock, or
// the platform. This key holds those. When it differs from the key kept beside the data, the data is
// deleted and the suite runs whole (tools/check/pytest-selected.ts).

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { API_DIR, E2E_DIR, WEB_DIR } from "../lib/paths.ts";

export type DataFile = { path: string; bytes: Uint8Array };
export type DataKeyInputs = { files: DataFile[]; python: string; testmon: string; coverage: string; platform: string };

/** Every file of apps/api that is not Python code. */
export function isDataInput(path: string): boolean {
  return !path.endsWith(".py");
}

export function dataKey(inputs: DataKeyInputs): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(`python ${inputs.python}\0testmon ${inputs.testmon}\0coverage ${inputs.coverage}\0${inputs.platform}\0`);
  for (const file of [...inputs.files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    hasher.update(`${file.path}\0`);
    hasher.update(file.bytes);
    hasher.update("\0");
  }
  return hasher.digest("hex");
}

/** The version of a package in uv.lock. */
export function lockedVersion(lock: string, name: string): string {
  const match = new RegExp(`\\[\\[package\\]\\]\\nname = "${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\nversion = "([^"]+)"`).exec(lock);
  if (!match) throw new Error(`${name} is not in uv.lock; it is needed for the key of testmon's data.`);
  return match[1]!;
}

/** The files git knows of under apps/api, tracked or untracked and not ignored, relative to apps/api. */
function filesOfApi(): string[] {
  const result = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--deduplicate", "."], {
    cwd: API_DIR,
    encoding: "utf8",
    maxBuffer: 64 << 20,
  });
  if (result.status !== 0) throw new Error(`git ls-files failed in apps/api: ${result.stderr.trim()}`);
  return result.stdout.split("\0").filter(Boolean);
}

/** The weather fixtures of the browser tests, written and held by pytest (apps/api/tests/weather_fixtures.py). */
export const E2E_WEATHER_FIXTURE = /^weather-.*\.json$/;

/** Those files under e2e/fixtures, named from the root of the repo so they never meet a file of apps/api. */
export function e2eWeatherFixtures(e2eDir: string = E2E_DIR): DataFile[] {
  const directory = join(e2eDir, "fixtures");
  return readdirSync(directory)
    .filter((name) => E2E_WEATHER_FIXTURE.test(name))
    .sort()
    .map((name) => ({ path: `e2e/fixtures/${name}`, bytes: new Uint8Array(readFileSync(join(directory, name))) }));
}

/** The files of the web app a pytest reads, from apps/web: the library's catalog (D118), Home's figures of the demo (D120). */
export const WEB_FILES_OF_PYTEST = ["public/equipment/catalog.json", "lib/home/home-view.ts"] as const;

/** Those files, named from the root of the repo. */
export function webFilesOfPytest(webDir: string = WEB_DIR): DataFile[] {
  return WEB_FILES_OF_PYTEST.map((path) => ({ path: `apps/web/${path}`, bytes: new Uint8Array(readFileSync(join(webDir, path))) }));
}

export function readDataKeyInputs(apiDir: string = API_DIR, e2eDir: string = E2E_DIR, webDir: string = WEB_DIR): DataKeyInputs {
  const lock = readFileSync(join(apiDir, "uv.lock"), "utf8");
  const files = filesOfApi()
    .filter(isDataInput)
    .map((path) => ({ path, bytes: new Uint8Array(readFileSync(join(apiDir, path))) }));
  return {
    files: [...files, ...e2eWeatherFixtures(e2eDir), ...webFilesOfPytest(webDir)],
    python: readFileSync(join(apiDir, ".python-version"), "utf8").trim(),
    testmon: lockedVersion(lock, "pytest-testmon"),
    coverage: lockedVersion(lock, "coverage"),
    platform: `${process.platform}-${process.arch}`,
  };
}
