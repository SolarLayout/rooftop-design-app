// The hashes turbo would give every task of a tree, without running anything (`--dry=json`).

import { spawnSync } from "node:child_process";
import { TOOLCHAIN_VARIABLE } from "../toolchain.ts";
import { envWithNode, resolveNode } from "../../lib/node.ts";
import { packageFile, REPO_ROOT } from "../../lib/paths.ts";

export const EVERY_TASK = ["typecheck", "typecheck:tools", "lint", "imports", "test", "test:tools", "proofs"];

/** Task id to hash, for the tasks that have a command in the tree. */
export function turboHashes(tree: string, toolchain: string): Map<string, string> {
  const bin = packageFile("turbo", "bin/turbo", REPO_ROOT);
  const node = resolveNode();
  if (!bin || !node) throw new Error("turbo or Node is not installed; run `bun install`.");
  const result = spawnSync(bin, ["run", ...EVERY_TASK, "--dry=json", "--no-daemon"], {
    cwd: tree,
    encoding: "utf8",
    maxBuffer: 64 << 20,
    env: { ...envWithNode(node), [TOOLCHAIN_VARIABLE]: toolchain },
  });
  if (result.status !== 0) throw new Error(`turbo --dry failed in ${tree}: ${result.stderr.trim()}`);
  const parsed = JSON.parse(result.stdout) as { tasks: { taskId: string; hash: string; command: string }[] };
  return new Map(parsed.tasks.filter((task) => task.command !== "<NONEXISTENT>").map((task) => [task.taskId, task.hash]));
}

/** The task ids whose hash differs between two trees. */
export function changedTasks(before: Map<string, string>, after: Map<string, string>): string[] {
  return [...new Set([...before.keys(), ...after.keys()])].filter((id) => before.get(id) !== after.get(id)).sort();
}
