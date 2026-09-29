// Finds a real Node.js for Next.js, tsc, eslint and Playwright.
//
// Next must run on Node, never on the bun runtime. On a machine where `node` is not on PATH, bun quietly
// puts a fake `node` (bun itself) in front of scripts it runs, so "it started" proves nothing. This module
// looks in the usual install places, rejects the fake, and returns the best real one.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { REPO_ROOT } from "./paths.ts";

export const MINIMUM_NODE = "20.9.0";

export type NodeCandidate = { path: string; version: string };
export type ResolvedNode = NodeCandidate & { binDir: string };

/** "v20.20.2" or "20.20.2" to [20, 20, 2]; null when it is not a version. */
export function parseVersion(text: string): [number, number, number] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(text.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Negative when a < b, zero when equal, positive when a > b. Unreadable versions sort lowest. */
export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a) ?? [-1, -1, -1];
  const right = parseVersion(b) ?? [-1, -1, -1];
  for (let i = 0; i < 3; i++) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function satisfiesMinimum(version: string, minimum: string = MINIMUM_NODE): boolean {
  return parseVersion(version) !== null && compareVersions(version, minimum) >= 0;
}

/**
 * Picks the Node to use. Candidates below the minimum are dropped. Of the rest: the exact version of
 * .nvmrc wins, then the same major as .nvmrc (newest first), then the newest of all. Ties keep the
 * order of the list, so an earlier place (PATH) beats a later one.
 */
export function pickNode(
  candidates: NodeCandidate[],
  wanted: string | null,
  minimum: string = MINIMUM_NODE,
): NodeCandidate | null {
  const usable = candidates.filter((candidate) => satisfiesMinimum(candidate.version, minimum));
  if (usable.length === 0) return null;

  const wantedParts = wanted ? parseVersion(wanted) : null;
  const rank = (candidate: NodeCandidate): number => {
    if (!wantedParts) return 0;
    const parts = parseVersion(candidate.version);
    if (!parts) return 0;
    if (compareVersions(candidate.version, wantedParts.join(".")) === 0) return 2;
    return parts[0] === wantedParts[0] ? 1 : 0;
  };

  return usable
    .map((candidate, index) => ({ candidate, index }))
    .sort(
      (a, b) =>
        rank(b.candidate) - rank(a.candidate) ||
        compareVersions(b.candidate.version, a.candidate.version) ||
        a.index - b.index,
    )[0]!.candidate;
}

export function wantedNodeVersion(): string | null {
  try {
    const text = readFileSync(join(REPO_ROOT, ".nvmrc"), "utf8").trim();
    return parseVersion(text) ? text.replace(/^v/, "") : null;
  } catch {
    return null;
  }
}

function children(directory: string): string[] {
  try {
    return readdirSync(directory).map((name) => join(directory, name));
  } catch {
    return [];
  }
}

/** Every place a Node binary may live on this machine, most specific first. */
export function candidatePaths(env: NodeJS.ProcessEnv = process.env): string[] {
  const home = homedir();
  const paths: string[] = [];

  if (env.ROOFTOP_NODE) paths.push(env.ROOFTOP_NODE);

  for (const directory of (env.PATH ?? "").split(delimiter)) {
    if (directory) paths.push(join(directory, "node"));
  }

  for (const prefix of ["/opt/homebrew", "/usr/local", "/home/linuxbrew/.linuxbrew"]) {
    paths.push(join(prefix, "bin", "node"));
    for (const keg of children(join(prefix, "opt"))) {
      if (/\/node(@\d+)?$/.test(keg)) paths.push(join(keg, "bin", "node"));
    }
  }

  const nvmDir = env.NVM_DIR ?? join(home, ".nvm");
  for (const version of children(join(nvmDir, "versions", "node"))) paths.push(join(version, "bin", "node"));

  for (const base of [
    env.FNM_DIR,
    join(home, ".local", "share", "fnm"),
    join(home, "Library", "Application Support", "fnm"),
    join(home, ".fnm"),
  ]) {
    if (!base) continue;
    for (const version of children(join(base, "node-versions"))) {
      paths.push(join(version, "installation", "bin", "node"));
    }
  }

  for (const version of children(join(env.VOLTA_HOME ?? join(home, ".volta"), "tools", "image", "node"))) {
    paths.push(join(version, "bin", "node"));
  }
  for (const version of children(join(home, ".local", "share", "mise", "installs", "node"))) {
    paths.push(join(version, "bin", "node"));
  }
  for (const version of children(join(home, ".asdf", "installs", "nodejs"))) {
    paths.push(join(version, "bin", "node"));
  }

  return [...new Set(paths)];
}

/** Runs the binary and returns its version, or null when it is missing, broken, or bun in disguise. */
export function probeNode(path: string): NodeCandidate | null {
  if (!existsSync(path)) return null;
  const result = spawnSync(
    path,
    ["-e", "process.stdout.write(JSON.stringify({node:process.versions.node,bun:process.versions.bun||null}))"],
    { encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] },
  );
  if (result.status !== 0 || !result.stdout) return null;
  try {
    const found = JSON.parse(result.stdout) as { node?: string; bun?: string | null };
    if (found.bun || !found.node || !parseVersion(found.node)) return null;
    return { path, version: found.node };
  } catch {
    return null;
  }
}

let cached: ResolvedNode | null | undefined;

export function resolveNode(): ResolvedNode | null {
  if (cached !== undefined) return cached;
  const candidates = candidatePaths()
    .map(probeNode)
    .filter((candidate): candidate is NodeCandidate => candidate !== null);
  const picked = pickNode(candidates, wantedNodeVersion());
  cached = picked ? { ...picked, binDir: dirname(picked.path) } : null;
  return cached;
}

export function nodeMissingMessage(): string {
  const wanted = wantedNodeVersion() ?? MINIMUM_NODE;
  return [
    `No Node.js ${MINIMUM_NODE} or newer was found on this machine.`,
    "Next.js runs on Node, never on the bun runtime, so the web app cannot start.",
    `Install Node ${wanted} (the version in .nvmrc), for example with \`brew install node@20\` or nvm,`,
    "or set ROOFTOP_NODE to the full path of a node binary. Looked on PATH and in the usual places of",
    "Homebrew, nvm, fnm, volta, mise and asdf.",
  ].join("\n");
}

/** The environment for child processes: the real Node first on PATH. */
export function envWithNode(node: ResolvedNode, base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const rest = (base.PATH ?? "").split(delimiter).filter((directory) => directory && directory !== node.binDir);
  return { ...base, PATH: [node.binDir, ...rest].join(delimiter) };
}
