// The pictures of the in-app help's how-tos (D81, docs/help-content.md, "Pictures"): Playwright on Node, as the soak of
// Present runs, with its own configuration (e2e/help-pictures/playwright.config.ts), on the test stack (started by the
// global setup when it is not running, and stopped after in that case). Writes apps/web/public/help/<dir>/<n>.jpg for each
// how-to of tools/help/pictures.ts. Run by hand when a how-to or the screens it shows change, never by the check.
//   bun help:pictures                      every how-to
//   bun help:pictures -g find/move-the-roof  one how-to, by its folder

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

const result = spawnSync(playwright, ["test", "--config", "help-pictures/playwright.config.ts", ...process.argv.slice(2)], { cwd: E2E_DIR, stdio: "inherit", env: envWithNode(node) });
if (result.error) {
  console.error(`playwright could not start: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
