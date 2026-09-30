// The versions of the tools and runtimes a check runs on, as one string.
//
// turbo hashes the files of a package and the lockfile, but not the Node that runs, nor bun, uv or
// Python. The check computes this string and hands it to turbo as ROOFTOP_TOOLCHAIN (named in
// `globalEnv` of turbo.json), so that a different toolchain is a different hash.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveNode } from "../lib/node.ts";
import { API_DIR } from "../lib/paths.ts";

export type Toolchain = { node: string; bun: string; uv: string; python: string; platform: string };

/** The variable turbo reads; see turbo.json, `globalEnv`. */
export const TOOLCHAIN_VARIABLE = "ROOFTOP_TOOLCHAIN";

export function toolchainString(toolchain: Toolchain): string {
  return `node ${toolchain.node}; bun ${toolchain.bun}; uv ${toolchain.uv}; python ${toolchain.python}; ${toolchain.platform}`;
}

/** "uv 0.11.26 (Homebrew 2026-06-30 aarch64-apple-darwin)" to "0.11.26". */
export function parseUvVersion(line: string): string {
  const match = /^uv (\d+\.\d+\.\d+)/.exec(line.trim());
  if (!match) throw new Error(`Could not read the version of uv from \`uv --version\`: "${line.trim()}".`);
  return match[1]!;
}

function uvVersion(): string {
  const result = spawnSync("uv", ["--version"], { encoding: "utf8", timeout: 10_000 });
  if (result.error) throw new Error(`uv is not installed or not on PATH: ${result.error.message}`);
  return parseUvVersion(result.stdout);
}

/** The Python uv runs the API with: `apps/api/.python-version`, which uv follows exactly (python-preference only-managed). */
function pythonVersion(): string {
  return readFileSync(join(API_DIR, ".python-version"), "utf8").trim();
}

/** The toolchain of this machine. Throws when a tool is missing, with the reason. */
export function readToolchain(): Toolchain {
  const node = resolveNode();
  if (!node) throw new Error("No Node.js found; the toolchain cannot be named.");
  return {
    node: node.version,
    bun: process.versions.bun ?? "unknown",
    uv: uvVersion(),
    python: pythonVersion(),
    platform: `${process.platform}-${process.arch}`,
  };
}
