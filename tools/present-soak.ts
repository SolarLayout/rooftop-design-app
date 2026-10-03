// The soak of Present (plan/phase-10-plan.md, step 21, decision 11): Playwright on Node, as tools/with-node.ts runs a
// tool, with the soak's own configuration (e2e/soak/playwright.config.ts): one desktop browser opens /present on the
// test stack (started by the global setup when it is not running, and stopped after in that case), runs the tour for
// thirty minutes, reads the frame times and the heap every minute and prints a table; the exit code is the acceptance's.
// Run once by the session, never by the check: `bun check` knows nothing of it.
//   bun tools/present-soak.ts                    thirty minutes, software WebGL as the tests have it
//   ROOFTOP_SOAK_MINUTES=5 bun tools/present-soak.ts
//   ROOFTOP_SOAK_GPU=1 bun tools/present-soak.ts   the machine's own graphics, as a stand would run

import { spawnSync } from "node:child_process";
import { envWithNode, nodeMissingMessage, resolveNode } from "./lib/node.ts";
import { binFile, E2E_DIR } from "./lib/paths.ts";

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

const minutes = process.env.ROOFTOP_SOAK_MINUTES ?? "30";
console.log(`present-soak: ${minutes} minutes of the tour on the test stack; the table follows, a row a minute.`);
const result = spawnSync(playwright, ["test", "--config", "soak/playwright.config.ts", ...process.argv.slice(2)], { cwd: E2E_DIR, stdio: "inherit", env: envWithNode(node) });
if (result.error) {
  console.error(`playwright could not start: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
