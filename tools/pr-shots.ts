// Puts a pull request's screenshots on the orphan branch pr-shots and prints their links (docs/screenshots.md). Git's
// plumbing alone, with an index of its own: the working tree, the branch checked out and its index are never touched.
//   bun tools/pr-shots.ts <folder> <file>...      e.g. bun tools/pr-shots.ts help-topics-roof .playwright-mcp/help/*.png

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { markdownOf, problemsOfFolder, publishedPathOf, rawUrlOf, repoOf } from "./lib/pr-shots.ts";

const BRANCH = "pr-shots";

function git(args: string[], env: Record<string, string> = {}): string {
  const result = spawnSync("git", args, { encoding: "utf8", env: { ...process.env, ...env } });
  if (result.status !== 0) {
    console.error(`git ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
    process.exit(1);
  }
  return result.stdout.trim();
}

const [folder, ...files] = process.argv.slice(2);
if (!folder || files.length === 0) {
  console.error("Usage: bun tools/pr-shots.ts <folder> <file>...  (one folder a pull request, such as help-topics-roof)");
  process.exit(2);
}
const problems = [...problemsOfFolder(folder), ...files.filter((file) => !existsSync(file)).map((file) => `${file}: no such file`)];
if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(2);
}
const repo = repoOf(git(["remote", "get-url", "origin"]));
if (!repo) {
  console.error("The remote origin is not on GitHub: the links could not be written.");
  process.exit(1);
}

// The branch as it is on GitHub, or none yet: the first screenshots begin it.
const fetched = spawnSync("git", ["fetch", "-q", "origin", BRANCH], { encoding: "utf8" });
const parent = fetched.status === 0 ? git(["rev-parse", `origin/${BRANCH}`]) : null;

const scratch = mkdtempSync(join(tmpdir(), "pr-shots-"));
const index = { GIT_INDEX_FILE: join(scratch, "index") };
try {
  if (parent) git(["read-tree", parent], index);
  const published = files.map((file) => {
    const path = publishedPathOf(folder, file);
    const blob = git(["hash-object", "-w", file]);
    git(["update-index", "--add", "--cacheinfo", `100644,${blob},${path}`], index);
    return path;
  });
  const tree = git(["write-tree"], index);
  const commit = git(["commit-tree", tree, ...(parent ? ["-p", parent] : []), "-m", `Screenshots: ${folder}`]);
  git(["push", "-q", "origin", `${commit}:refs/heads/${BRANCH}`]);
  console.log(`pr-shots: ${published.length} file(s) in ${folder}/ at ${commit}\n`);
  console.log(markdownOf(published.map((path) => rawUrlOf(repo, commit, path))));
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
