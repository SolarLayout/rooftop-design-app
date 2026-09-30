// A worktree of the repo for tests that change files: the tests of the caching never touch the working
// tree. The worktree is HEAD with the working tree's uncommitted changes applied and its untracked files
// copied, so it is the tree the check would see. It lives under the system's temporary directory and is
// removed afterwards; a worktree of ours left behind by a crash is removed at the next start.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { REPO_ROOT } from "../../lib/paths.ts";

// The real path: on macOS the temporary directory is a symbolic link, and git reports real paths.
export const PROOFS_DIR = join(realpathSync(tmpdir()), "rooftop-check-proofs");

export type Worktree = { path: string; remove: () => void };

function git(args: string[], cwd: string, input?: string): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", input, maxBuffer: 256 << 20 });
  if (result.status !== 0) throw new Error(`git ${args.slice(0, 2).join(" ")} failed in ${cwd}: ${result.stderr.trim()}`);
  return result.stdout;
}

/** Every worktree of the repo registered under PROOFS_DIR. */
export function registeredProofWorktrees(repo: string = REPO_ROOT): string[] {
  return git(["worktree", "list", "--porcelain"], repo)
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length))
    .filter((path) => path.startsWith(PROOFS_DIR));
}

export function removeWorktree(path: string, repo: string = REPO_ROOT): void {
  spawnSync("git", ["worktree", "remove", "--force", path], { cwd: repo, encoding: "utf8" });
  rmSync(path, { recursive: true, force: true });
  spawnSync("git", ["worktree", "prune"], { cwd: repo, encoding: "utf8" });
}

/** The uncommitted changes of the working tree, tracked files only, as one binary patch. */
function uncommittedPatch(repo: string): string {
  return git(["diff", "--binary", "HEAD"], repo);
}

function untrackedFiles(repo: string): string[] {
  return git(["ls-files", "-z", "--others", "--exclude-standard"], repo).split("\0").filter(Boolean);
}

export function makeWorktree(repo: string = REPO_ROOT): Worktree {
  for (const stale of registeredProofWorktrees(repo)) removeWorktree(stale, repo);
  mkdirSync(PROOFS_DIR, { recursive: true });
  const path = join(PROOFS_DIR, `${process.pid}-${Date.now().toString(36)}`);
  git(["worktree", "add", "--detach", "--quiet", path, "HEAD"], repo);
  try {
    const patch = uncommittedPatch(repo);
    if (patch.length > 0) git(["apply", "--whitespace=nowarn"], path, patch);
    for (const file of untrackedFiles(repo)) {
      const target = join(path, file);
      if (!existsSync(dirname(target))) mkdirSync(dirname(target), { recursive: true });
      cpSync(join(repo, file), target);
    }
  } catch (error) {
    removeWorktree(path, repo);
    throw error;
  }
  return { path, remove: () => removeWorktree(path, repo) };
}
