// The key of pytest-testmon's data (apps/api/.testmondata): what testmon does not track itself.
//
// Testmon fingerprints the Python code each test executes, and knows the Python version and the list of
// installed packages without their patch versions. It does not see the data files the tests read (the
// fixtures, the samples of rooftop_core), the pytest options in pyproject.toml, uv.lock, or the platform.
// This key holds those. When it differs from the key kept beside the data, the data is deleted and the
// suite runs whole (tools/check/pytest-selected.ts).

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { API_DIR } from "../lib/paths.ts";

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

export function readDataKeyInputs(apiDir: string = API_DIR): DataKeyInputs {
  const lock = readFileSync(join(apiDir, "uv.lock"), "utf8");
  const files = filesOfApi()
    .filter(isDataInput)
    .map((path) => ({ path, bytes: new Uint8Array(readFileSync(join(apiDir, path))) }));
  return {
    files,
    python: readFileSync(join(apiDir, ".python-version"), "utf8").trim(),
    testmon: lockedVersion(lock, "pytest-testmon"),
    coverage: lockedVersion(lock, "coverage"),
    platform: `${process.platform}-${process.arch}`,
  };
}
