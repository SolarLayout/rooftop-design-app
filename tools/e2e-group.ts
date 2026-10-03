// Runs one group of the browser tests (tools/check/e2e-groups.ts): Playwright in e2e, on the group's
// suites, with the real Node first on PATH, as tools/with-node.ts does. The root scripts `e2e:<id>` call it;
// `bun check` runs the groups as turbo tasks. Anything after the group goes to Playwright.
//   bun tools/e2e-group.ts kit
//   bun tools/e2e-group.ts find --project=desktop

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { GROUPS, groupById, suitesOf } from "./check/e2e-groups.ts";
import { envWithNode, nodeMissingMessage, resolveNode } from "./lib/node.ts";
import { binFile, E2E_DIR } from "./lib/paths.ts";

const [id, ...rest] = process.argv.slice(2);
const group = id ? groupById(id) : null;
if (!group) {
  console.error(`Usage: bun tools/e2e-group.ts <group> [Playwright arguments]. Groups: ${GROUPS.map((candidate) => candidate.id).join(", ")}.`);
  process.exit(2);
}

const node = resolveNode();
if (!node) {
  console.error(nodeMissingMessage());
  process.exit(1);
}

const playwright = binFile("playwright", E2E_DIR);
if (!playwright) {
  console.error("playwright was not found in node_modules/.bin. Run `bun install` first.");
  process.exit(1);
}

const suites = suitesOf(group, readdirSync(join(E2E_DIR, "tests")));
if (suites.length === 0) {
  console.error(`The group ${group.id} has no suite in e2e/tests.`);
  process.exit(1);
}

console.log(`e2e: group ${group.id}, ${suites.length} suite${suites.length === 1 ? "" : "s"}: ${suites.map((suite) => suite.slice("tests/".length)).join(", ")}`);
const result = spawnSync(playwright, ["test", ...suites, ...rest], { cwd: E2E_DIR, stdio: "inherit", env: envWithNode(node) });
if (result.error) {
  console.error(`playwright could not start: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
