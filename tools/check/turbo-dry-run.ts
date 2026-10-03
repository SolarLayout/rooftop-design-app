// What turbo would run, without running anything (`turbo run <tasks> --dry=json`): each task's hash, its
// command, and whether the cache has an entry for it. The check asks before the browser step, so that the
// test stack is started only when a group runs; the proofs read the hashes of every task.

import { spawnSync } from "node:child_process";
import { envWithNode, resolveNode } from "../lib/node.ts";
import { packageFile, REPO_ROOT } from "../lib/paths.ts";
import { TOOLCHAIN_VARIABLE } from "./toolchain.ts";

export type DryTask = { taskId: string; hash: string; command: string; cached: boolean };

type RawTask = { taskId?: unknown; hash?: unknown; command?: unknown; cache?: { status?: unknown } };

export function readDryRun(text: string): DryTask[] {
  let parsed: { tasks?: unknown };
  try {
    parsed = JSON.parse(text) as { tasks?: unknown };
  } catch (error) {
    throw new Error(`turbo's dry run could not be read: ${(error as Error).message}`);
  }
  if (!Array.isArray(parsed.tasks)) throw new Error("turbo's dry run has no tasks: not a dry run.");
  return (parsed.tasks as RawTask[]).map((task) => {
    if (typeof task.taskId !== "string" || typeof task.hash !== "string" || typeof task.command !== "string") {
      throw new Error("turbo's dry run has a task without an id, a hash or a command: not a dry run.");
    }
    return { taskId: task.taskId, hash: task.hash, command: task.command, cached: task.cache?.status === "HIT" };
  });
}

/** Runs the dry run in a tree, with the toolchain in the environment as the check sets it. */
export function turboDryRun(tree: string, tasks: string[], toolchain: string, filters: string[] = []): DryTask[] {
  const bin = packageFile("turbo", "bin/turbo", REPO_ROOT);
  const node = resolveNode();
  if (!bin || !node) throw new Error("turbo or Node is not installed; run `bun install`.");
  const result = spawnSync(bin, ["run", ...tasks, ...filters.map((filter) => `--filter=${filter}`), "--dry=json", "--no-daemon"], {
    cwd: tree,
    encoding: "utf8",
    maxBuffer: 64 << 20,
    env: { ...envWithNode(node), [TOOLCHAIN_VARIABLE]: toolchain },
  });
  if (result.status !== 0) throw new Error(`turbo --dry failed in ${tree}: ${result.stderr.trim()}`);
  return readDryRun(result.stdout);
}
