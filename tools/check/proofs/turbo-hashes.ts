// The hashes turbo would give every task of a tree, without running anything (`--dry=json`).

import { GROUPS, scriptOf } from "../e2e-groups.ts";
import { turboDryRun } from "../turbo-dry-run.ts";

export const EVERY_TASK = ["typecheck", "typecheck:tools", "lint", "imports", "test", "test:tools", ...GROUPS.map(scriptOf), "proofs"];

/** Task id to hash, for the tasks that have a command in the tree. */
export function turboHashes(tree: string, toolchain: string): Map<string, string> {
  return new Map(
    turboDryRun(tree, EVERY_TASK, toolchain)
      .filter((task) => task.command !== "<NONEXISTENT>")
      .map((task) => [task.taskId, task.hash]),
  );
}

/** The task ids whose hash differs between two trees. */
export function changedTasks(before: Map<string, string>, after: Map<string, string>): string[] {
  return [...new Set([...before.keys(), ...after.keys()])].filter((id) => before.get(id) !== after.get(id)).sort();
}
